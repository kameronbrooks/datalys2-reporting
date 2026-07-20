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
export declare function compareValues(a: any, b: any, dtype?: string): number;
/**
 * Stable multi-key sort. Returns a new sorted array.
 * @param rows Records (objects keyed by column name).
 * @param keys Sort keys in priority order.
 */
export declare function multiSort<T extends Record<string, any>>(rows: T[], keys: SortKey[]): T[];
