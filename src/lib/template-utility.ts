import type { Dataset } from "./types";

export type TemplateValue =
    | string
    | {
          template?: string;
          expr?: string;
          /**
           * Arbitrary JavaScript expression (UNSAFE).
           */
          unsafeJs?: string;
      };

export interface TemplateContext {
    datasets: Record<string, Dataset>;
    props?: Record<string, unknown>;
    /**
     * The data row a modal was opened for (row-detail modals). Lets card
     * templates reference the clicked row, e.g. {{ row.Region }}.
     */
    row?: Record<string, unknown>;
}

function toNumber(v: unknown): number | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function columnIndex(dataset: Dataset, col: unknown): number | undefined {
    if (typeof col === "number" && Number.isInteger(col) && col >= 0) return col;
    if (typeof col === "string") {
        const idx = dataset.columns.indexOf(col);
        return idx >= 0 ? idx : undefined;
    }
    return undefined;
}

function agg(dataset: Dataset, col: unknown, op: "sum" | "avg" | "min" | "max"): number | undefined {
    const idx = columnIndex(dataset, col);
    if (idx === undefined) return undefined;
    const colName = dataset.columns?.[idx] ?? (typeof col === "string" ? col : undefined);

    const values: number[] = [];
    for (const row of dataset.data ?? []) {
        // Table format: array rows indexed by column position.
        // Records format: object rows keyed by column name.
        const cell = Array.isArray(row)
            ? row[idx]
            : (row && typeof row === "object" && colName !== undefined ? (row as any)[colName] : undefined);
        const n = toNumber(cell);
        if (n !== undefined) values.push(n);
    }

    if (values.length === 0) return undefined;

    if (op === "sum") return values.reduce((a, b) => a + b, 0);
    if (op === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
    if (op === "min") return Math.min(...values);
    return Math.max(...values);
}

function createHelpers(ctx: TemplateContext) {
    return {
        count: (datasetId: string) => {
            const ds = ctx.datasets?.[datasetId];
            return ds ? (ds.data?.length ?? 0) : 0;
        },
        sum: (datasetId: string, col: string | number) => {
            const ds = ctx.datasets?.[datasetId];
            return ds ? agg(ds, col, "sum") : undefined;
        },
        avg: (datasetId: string, col: string | number) => {
            const ds = ctx.datasets?.[datasetId];
            return ds ? agg(ds, col, "avg") : undefined;
        },
        min: (datasetId: string, col: string | number) => {
            const ds = ctx.datasets?.[datasetId];
            return ds ? agg(ds, col, "min") : undefined;
        },
        max: (datasetId: string, col: string | number) => {
            const ds = ctx.datasets?.[datasetId];
            return ds ? agg(ds, col, "max") : undefined;
        },
        formatNumber: (value: unknown, digits?: number) => {
            const n = toNumber(value);
            if (n === undefined) return "";
            if (digits !== undefined && Number.isInteger(digits)) return n.toFixed(digits);
            return n.toLocaleString();
        },
        formatPercent: (value: unknown, digits: number = 1) => {
            const n = toNumber(value);
            if (n === undefined) return "";
            return `${(n * 100).toFixed(digits)}%`;
        },
        formatCurrency: (value: unknown, symbol: string = "$", digits: number = 2) => {
            const n = toNumber(value);
            if (n === undefined) return "";
            return `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
        }
    };
}

function evalUnsafeJsExpression(code: string, ctx: TemplateContext): unknown {
    // WARNING: This is intentionally UNSAFE. There is no true sandbox in the browser
    // for arbitrary JS provided by content. This is only for trusted inputs.
    const datasets = ctx.datasets;
    const props = ctx.props ?? {};
    const row = ctx.row ?? {};
    const helpers = createHelpers(ctx);

    // Wrap in parentheses so `a ? b : c` works.
    const fn = new Function(
        "datasets",
        "props",
        "row",
        "helpers",
        `"use strict";
         const { count, sum, avg, min, max, formatNumber, formatPercent, formatCurrency } = helpers;
         return (${code});`
    ) as unknown as (
        datasets: Record<string, Dataset>,
        props: Record<string, unknown>,
        row: Record<string, unknown>,
        helpers: ReturnType<typeof createHelpers>
    ) => unknown;

    return fn(datasets, props as Record<string, unknown>, row as Record<string, unknown>, helpers);
}

function stringifyValue(v: unknown): string {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    try {
        return JSON.stringify(v);
    } catch {
        return String(v);
    }
}

/**
 * Renders a template with `{{ ... }}` placeholders.
 *
 * Each placeholder (and the `expr` / `unsafeJs` object forms) is evaluated as
 * a JavaScript expression via `new Function` with `datasets`, `props`, `row`,
 * and the helper functions (`count`, `sum`, `avg`, `min`, `max`,
 * `formatNumber`, `formatPercent`, `formatCurrency`) in scope.
 *
 * ⚠️ This executes arbitrary JavaScript from the report config in the
 * viewer's browser. Only render templates from trusted report-data.
 */
export function renderTemplate(value: TemplateValue | null | undefined, ctx: TemplateContext): string {
    if (value == null) return "";

    if (typeof value !== "string" && (value.unsafeJs || value.expr)) {
        const code = (value.unsafeJs ?? value.expr ?? "").trim();
        if (!code) return "";
        try {
            return stringifyValue(evalUnsafeJsExpression(code, ctx));
        } catch (err) {
            console.warn("Failed to evaluate expression", err);
            return "";
        }
    }

    const template = typeof value === "string" ? value : (value.template ?? value.expr ?? "");

    if (!template) return "";

    return template.replace(/\{\{([\s\S]*?)\}\}/g, (_m, inner) => {
        const code = String(inner).trim();
        if (!code) return "";
        try {
            return stringifyValue(evalUnsafeJsExpression(code, ctx));
        } catch (err) {
            console.warn("Failed to evaluate template expression", err);
            return "";
        }
    });
}
