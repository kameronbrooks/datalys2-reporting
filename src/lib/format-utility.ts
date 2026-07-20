import { isDate, printDate } from "./date-utility";

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

export const KNOWN_COLUMN_FORMATS: ColumnFormatKind[] = ['number', 'currency', 'percent', 'date', 'hms'];

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
export function resolveColumnFormats(prop?: ColumnFormatsProp): Record<string, ColumnFormat> {
    const resolved: Record<string, ColumnFormat> = {};
    if (!prop) return resolved;
    for (const col in prop) {
        const spec = typeof prop[col] === 'string' ? { format: prop[col] as ColumnFormatKind } : prop[col] as ColumnFormat;
        if (spec && KNOWN_COLUMN_FORMATS.includes(spec.format)) {
            resolved[col] = spec;
        }
    }
    return resolved;
}

function toNumber(value: any): number | undefined {
    if (typeof value === 'number') return isNaN(value) ? undefined : value;
    if (isDate(value)) return (value as Date).getTime();
    if (value === null || value === undefined || value === '') return undefined;
    const n = Number(value);
    return isNaN(n) ? undefined : n;
}

/**
 * Formats one value per a column format spec. Null/undefined/empty → ''.
 * Non-numeric values under numeric formats fall back to their string form.
 */
export function formatValue(value: any, spec: ColumnFormat): string {
    if (value === null || value === undefined || value === '') return '';

    if (spec.format === 'date') {
        if (isDate(value)) return printDate(value, undefined, true);
        const date = new Date(value);
        return isNaN(date.getTime()) ? String(value) : printDate(date, undefined, true);
    }

    const n = toNumber(value);
    if (n === undefined) return isDate(value) ? printDate(value, undefined, true) : String(value);

    switch (spec.format) {
        case 'hms': {
            // Seconds → HH:MM:SS (same behavior as the KPI visual)
            const sign = n < 0 ? '-' : '';
            const total = Math.abs(n);
            const hours = Math.floor(total / 3600);
            const minutes = Math.floor((total % 3600) / 60);
            const seconds = Math.floor(total % 60);
            return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        case 'currency': {
            const digits = spec.digits ?? 2;
            const symbol = spec.symbol ?? '$';
            const sign = n < 0 ? '-' : '';
            return `${sign}${symbol}${Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
        }
        case 'percent': {
            const digits = spec.digits ?? 1;
            return `${(n * 100).toFixed(digits)}%`;
        }
        case 'number':
        default: {
            if (spec.digits !== undefined) {
                return n.toLocaleString(undefined, { minimumFractionDigits: spec.digits, maximumFractionDigits: spec.digits });
            }
            return (+n.toFixed(4)).toLocaleString();
        }
    }
}
