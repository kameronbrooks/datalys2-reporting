import { isDate } from "./date-utility";

export interface SortKey {
    key: string;
    direction: 'asc' | 'desc';
    /** Dataset dtype for the column (enables type-aware comparison). */
    dtype?: string;
}

/**
 * Type-aware comparison for table sorting.
 * Rules: nulls/empty last (regardless of direction), Dates by time,
 * numbers numerically, numeric-looking strings numerically, other strings
 * via localeCompare (case-insensitive, natural number handling).
 * @returns negative / 0 / positive for ascending order.
 */
export function compareValues(a: any, b: any, dtype?: string): number {
    const aNull = a === null || a === undefined || a === '';
    const bNull = b === null || b === undefined || b === '';
    if (aNull && bNull) return 0;
    if (aNull) return 1;  // nulls last
    if (bNull) return -1;

    if (isDate(a) && isDate(b)) {
        return (a as Date).getTime() - (b as Date).getTime();
    }

    if (typeof a === 'number' && typeof b === 'number') {
        return a - b;
    }

    if (typeof a === 'boolean' && typeof b === 'boolean') {
        return (a ? 1 : 0) - (b ? 1 : 0);
    }

    // Numeric dtype or numeric-looking strings: compare numerically
    const aNum = Number(a);
    const bNum = Number(b);
    const numericDtype = dtype === 'int' || dtype === 'float' || dtype === 'number';
    if ((numericDtype || (String(a).trim() !== '' && String(b).trim() !== '')) && !isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
    }

    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Stable multi-key sort. Returns a new sorted array.
 * @param rows Records (objects keyed by column name).
 * @param keys Sort keys in priority order.
 */
export function multiSort<T extends Record<string, any>>(rows: T[], keys: SortKey[]): T[] {
    if (!keys || keys.length === 0) return rows;
    // Array.prototype.sort is stable in all modern engines.
    return [...rows].sort((a, b) => {
        for (const sortKey of keys) {
            const result = compareValues(a[sortKey.key], b[sortKey.key], sortKey.dtype);
            if (result !== 0) {
                return sortKey.direction === 'asc' ? result : -result;
            }
        }
        return 0;
    });
}
