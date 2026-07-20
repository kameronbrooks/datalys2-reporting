import { Dataset, FilterCondition, FilterExpression } from "./types";
import { rowMatches } from "./filter-utility";

/**
 * Conditional formatting for tables and checklists.
 *
 * Config shape (the `conditionalFormats` prop):
 *   "conditionalFormats": [
 *     { "when": { "column": "amount", "op": "gt", "value": 10000 }, "style": "success" },
 *     { "when": { "column": "region", "op": "eq", "value": "EU" }, "target": "row", "style": "info" },
 *     { "when": { "column": "margin", "op": "lt", "value": 0 }, "css": { "color": "var(--dl2-error)" } }
 *   ]
 *
 * `when` is the standard JSON filter grammar, evaluated per data row.
 * Rules apply to data rows only (not totals or group aggregate rows).
 * The first matching rule wins per target; one row rule and one cell rule
 * per cell may compose (row background + cell highlight).
 */

export const KNOWN_CF_STYLES = ['success', 'warning', 'error', 'info', 'muted'];

export interface ConditionalFormat {
    /** Filter expression the row must match for the rule to apply. */
    when: FilterExpression;
    /** What to style: the matching cell(s) (default) or the whole row. */
    target?: 'cell' | 'row';
    /**
     * Cell-target only: columns to style. Defaults to the `when` condition's
     * column (single-condition rules); compound conditions must set this.
     */
    columns?: string[];
    /** Named style preset: success | warning | error | info | muted. */
    style?: string;
    /** Inline CSS overrides (camelCase React style keys), applied over `style`. */
    css?: Record<string, string | number>;
}

export interface ResolvedFormat {
    className?: string;
    style?: Record<string, string | number>;
}

export interface RowConditionalFormats {
    /** Format for the <tr> (row-target rules), if any rule matched. */
    row?: ResolvedFormat;
    /** Format per column name for <td>s (cell-target rules). */
    cells: Record<string, ResolvedFormat>;
}

function presetClassName(style?: string): string | undefined {
    return style && KNOWN_CF_STYLES.includes(style) ? `dl2-cf-${style}` : undefined;
}

/** Columns a cell-target rule styles (explicit list, else the condition's own column). */
export function ruleColumns(rule: ConditionalFormat): string[] {
    if (rule.columns && rule.columns.length > 0) return rule.columns;
    const column = (rule.when as FilterCondition)?.column;
    return typeof column === 'string' ? [column] : [];
}

/**
 * Evaluates conditional format rules against one data row.
 * First matching rule wins per target (per column for cell targets).
 */
export function evaluateConditionalFormats(
    row: any,
    rules: ConditionalFormat[] | undefined,
    dataset: Dataset
): RowConditionalFormats | null {
    if (!rules || rules.length === 0) return null;

    const result: RowConditionalFormats = { cells: {} };
    let matchedAny = false;

    for (const rule of rules) {
        if (!rule || !rule.when) continue;
        const resolved: ResolvedFormat = { className: presetClassName(rule.style), style: rule.css };
        if (!resolved.className && !resolved.style) continue;

        if (rule.target === 'row') {
            if (result.row) continue; // an earlier row rule already won
            if (rowMatches(row, rule.when, dataset)) {
                result.row = resolved;
                matchedAny = true;
            }
        } else {
            const columns = ruleColumns(rule).filter(col => result.cells[col] === undefined);
            if (columns.length === 0) continue;
            if (rowMatches(row, rule.when, dataset)) {
                columns.forEach(col => { result.cells[col] = resolved; });
                matchedAny = true;
            }
        }
    }

    return matchedAny ? result : null;
}
