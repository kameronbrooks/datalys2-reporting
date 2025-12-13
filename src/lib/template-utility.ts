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
}

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function isSafeKey(key: string): boolean {
    return !FORBIDDEN_KEYS.has(key);
}

function resolvePath(root: unknown, path: string): unknown {
    // Supports: a.b.c, a[0].b[1], and mixed.
    let current: any = root;

    const normalized = path.trim();
    if (!normalized) return undefined;

    // Tokenize identifiers and bracket indices.
    // Examples:
    //  - datasets.sales.data[0][1]
    //  - props.title
    const tokens: Array<string | number> = [];

    let i = 0;
    while (i < normalized.length) {
        const ch = normalized[i];

        if (ch === ".") {
            i++;
            continue;
        }

        if (ch === "[") {
            const close = normalized.indexOf("]", i + 1);
            if (close === -1) return undefined;
            const inside = normalized.slice(i + 1, close).trim();
            if (!inside) return undefined;

            // Only allow numeric indices: [0]
            if (!/^\d+$/.test(inside)) return undefined;
            tokens.push(Number(inside));
            i = close + 1;
            continue;
        }

        // identifier
        const m = /^[A-Za-z_$][A-Za-z0-9_$]*/.exec(normalized.slice(i));
        if (!m) return undefined;
        const ident = m[0];
        if (!isSafeKey(ident)) return undefined;
        tokens.push(ident);
        i += ident.length;
    }

    for (const t of tokens) {
        if (current == null) return undefined;

        if (typeof t === "number") {
            if (!Array.isArray(current)) return undefined;
            current = current[t];
            continue;
        }

        if (typeof current !== "object" && typeof current !== "function") return undefined;
        current = (current as any)[t];
    }

    return current;
}

function splitArgs(argString: string): string[] {
    const args: string[] = [];
    let current = "";
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < argString.length; i++) {
        const ch = argString[i];

        if (ch === "\\" && i + 1 < argString.length) {
            current += ch + argString[i + 1];
            i++;
            continue;
        }

        if (!inDouble && ch === "'") {
            inSingle = !inSingle;
            current += ch;
            continue;
        }

        if (!inSingle && ch === '"') {
            inDouble = !inDouble;
            current += ch;
            continue;
        }

        if (!inSingle && !inDouble && ch === ",") {
            const trimmed = current.trim();
            if (trimmed) args.push(trimmed);
            current = "";
            continue;
        }

        current += ch;
    }

    const trimmed = current.trim();
    if (trimmed) args.push(trimmed);
    return args;
}

function parseLiteralOrPath(raw: string, ctx: TemplateContext): unknown {
    const s = raw.trim();

    if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
        const quote = s[0];
        const inner = s.slice(1, -1);
        // Minimal unescape for same-quote and backslash
        return inner
            .replace(new RegExp("\\\\" + quote, "g"), quote)
            .replace(/\\\\/g, "\\");
    }

    if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
    if (s === "true") return true;
    if (s === "false") return false;
    if (s === "null") return null;

    // Treat as a path relative to a root context.
    return resolvePath({ datasets: ctx.datasets, props: ctx.props ?? {} }, s);
}

function toNumber(v: unknown): number | undefined {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
        const n = Number(v);
        return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
}

function getDataset(ctx: TemplateContext, datasetId: unknown): Dataset | undefined {
    if (typeof datasetId !== "string") return undefined;
    return ctx.datasets?.[datasetId];
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

    const values: number[] = [];
    for (const row of dataset.data ?? []) {
        if (!Array.isArray(row)) continue;
        const n = toNumber(row[idx]);
        if (n !== undefined) values.push(n);
    }

    if (values.length === 0) return undefined;

    if (op === "sum") return values.reduce((a, b) => a + b, 0);
    if (op === "avg") return values.reduce((a, b) => a + b, 0) / values.length;
    if (op === "min") return Math.min(...values);
    return Math.max(...values);
}

function evalFunctionCall(name: string, args: string[], ctx: TemplateContext): unknown {
    switch (name) {
        case "sum": {
            const datasetId = parseLiteralOrPath(args[0] ?? "", ctx);
            const col = parseLiteralOrPath(args[1] ?? "", ctx);
            const ds = getDataset(ctx, datasetId);
            return ds ? agg(ds, col, "sum") : undefined;
        }
        case "avg": {
            const datasetId = parseLiteralOrPath(args[0] ?? "", ctx);
            const col = parseLiteralOrPath(args[1] ?? "", ctx);
            const ds = getDataset(ctx, datasetId);
            return ds ? agg(ds, col, "avg") : undefined;
        }
        case "min": {
            const datasetId = parseLiteralOrPath(args[0] ?? "", ctx);
            const col = parseLiteralOrPath(args[1] ?? "", ctx);
            const ds = getDataset(ctx, datasetId);
            return ds ? agg(ds, col, "min") : undefined;
        }
        case "max": {
            const datasetId = parseLiteralOrPath(args[0] ?? "", ctx);
            const col = parseLiteralOrPath(args[1] ?? "", ctx);
            const ds = getDataset(ctx, datasetId);
            return ds ? agg(ds, col, "max") : undefined;
        }
        case "count": {
            const datasetId = parseLiteralOrPath(args[0] ?? "", ctx);
            const ds = getDataset(ctx, datasetId);
            return ds ? (ds.data?.length ?? 0) : 0;
        }
        case "formatNumber": {
            const v = parseLiteralOrPath(args[0] ?? "", ctx);
            const n = toNumber(v);
            const digits = toNumber(parseLiteralOrPath(args[1] ?? "", ctx));
            if (n === undefined) return undefined;
            if (digits !== undefined && Number.isInteger(digits)) return n.toFixed(digits);
            return n.toLocaleString();
        }
        case "formatPercent": {
            const v = parseLiteralOrPath(args[0] ?? "", ctx);
            const n = toNumber(v);
            const digits = toNumber(parseLiteralOrPath(args[1] ?? "", ctx));
            if (n === undefined) return undefined;
            const d = digits !== undefined && Number.isInteger(digits) ? digits : 1;
            return `${(n * 100).toFixed(d)}%`;
        }
        case "formatCurrency": {
            const v = parseLiteralOrPath(args[0] ?? "", ctx);
            const n = toNumber(v);
            const symbol = parseLiteralOrPath(args[1] ?? "'$'", ctx);
            const digits = toNumber(parseLiteralOrPath(args[2] ?? "", ctx));
            if (n === undefined) return undefined;
            const s = typeof symbol === "string" ? symbol : "$";
            const d = digits !== undefined && Number.isInteger(digits) ? digits : 2;
            return `${s}${n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`;
        }
        default:
            return undefined;
    }
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
    const helpers = createHelpers(ctx);

    // Wrap in parentheses so `a ? b : c` works.
    const fn = new Function(
        "datasets",
        "props",
        "helpers",
        `"use strict";
         const { count, sum, avg, min, max, formatNumber, formatPercent, formatCurrency } = helpers;
         return (${code});`
    ) as unknown as (
        datasets: Record<string, Dataset>,
        props: Record<string, unknown>,
        helpers: ReturnType<typeof createHelpers>
    ) => unknown;

    return fn(datasets, props as Record<string, unknown>, helpers);
}

function evalPlaceholder(content: string, ctx: TemplateContext): unknown {
    const trimmed = content.trim();
    if (!trimmed) return "";

    // Allowlisted function calls like sum('sales', 'amount')
    const fnMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\((.*)\)$/.exec(trimmed);
    if (fnMatch) {
        const fnName = fnMatch[1];
        const argStr = fnMatch[2].trim();
        const args = argStr ? splitArgs(argStr) : [];
        return evalFunctionCall(fnName, args, ctx);
    }

    // Otherwise interpret as a safe path.
    return resolvePath({ datasets: ctx.datasets, props: ctx.props ?? {} }, trimmed);
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
 * Supported placeholders:
 * - Paths: `{{datasets.sales.data[0][1]}}`, `{{props.title}}`
 * - Functions (allowlisted): `sum(...)`, `avg(...)`, `min(...)`, `max(...)`, `count(...)`, `formatNumber(...)`, `formatPercent(...)`, `formatCurrency(...)`
 *
 * This intentionally does NOT execute arbitrary JavaScript.
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
