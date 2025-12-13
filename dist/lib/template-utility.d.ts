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
export declare function renderTemplate(value: TemplateValue | null | undefined, ctx: TemplateContext): string;
