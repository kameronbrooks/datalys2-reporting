import type { Dataset } from "./types";
export type TemplateValue = string | {
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
export declare function renderTemplate(value: TemplateValue | null | undefined, ctx: TemplateContext): string;
