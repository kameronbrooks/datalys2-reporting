/**
 * Formats a cell value for text export (CSV/TSV).
 */
export declare function formatCellForExport(value: any): string;
/**
 * Builds a CSV string (with header row) from records.
 * @param columns Column names, in output order.
 * @param rows Records keyed by column name.
 */
export declare function toCSV(columns: string[], rows: Record<string, any>[]): string;
/**
 * Builds a TSV string (tabs strip out of values) — pastes cleanly into
 * spreadsheet apps.
 */
export declare function toTSV(columns: string[], rows: Record<string, any>[]): string;
/**
 * Triggers a client-side download of a CSV file.
 */
export declare function downloadCSV(filename: string, csv: string): void;
/**
 * Copies text to the clipboard, falling back to a hidden textarea +
 * execCommand when the async clipboard API is unavailable (e.g. file://).
 * @returns Promise resolving to true on success.
 */
export declare function copyTextToClipboard(text: string): Promise<boolean>;
