/**
 * Per-column display formatting for tables and checklists.
 *
 * Config shape (the `columnFormats` prop):
 *   "columnFormats": {
 *     "amount":  { "format": "currency", "symbol": "$", "digits": 0 },
 *     "rate":    { "format": "percent", "digits": 1 },
 *     "created": "date"                       // shorthand for { "format": "date" }
 *   }
 *
 * Formats match the Card/KPI `format` enum: number | currency | percent | date | hms.
 * Formatting is display-only — CSV export keeps raw values.
 */
export type ColumnFormatKind = 'number' | 'currency' | 'percent' | 'date' | 'hms';
export declare const KNOWN_COLUMN_FORMATS: ColumnFormatKind[];
export interface ColumnFormat {
    format: ColumnFormatKind;
    /** Decimal places. Defaults: number → locale default, currency → 2, percent → 1. */
    digits?: number;
    /** Currency symbol when format is 'currency'. Default '$'. */
    symbol?: string;
}
/** The `columnFormats` prop: per-column format spec or shorthand kind string. */
export type ColumnFormatsProp = Record<string, ColumnFormat | ColumnFormatKind>;
/**
 * Normalizes a `columnFormats` prop: expands shorthand strings and drops
 * entries with unknown format kinds (the validator warns about them).
 */
export declare function resolveColumnFormats(prop?: ColumnFormatsProp): Record<string, ColumnFormat>;
/**
 * Formats one value per a column format spec. Null/undefined/empty → ''.
 * Non-numeric values under numeric formats fall back to their string form.
 */
export declare function formatValue(value: any, spec: ColumnFormat): string;
