import { isDate, printDate } from "./date-utility";

/**
 * Formats a cell value for text export (CSV/TSV).
 */
export function formatCellForExport(value: any): string {
    if (value === null || value === undefined) return '';
    if (isDate(value)) return printDate(value, undefined, true);
    return String(value);
}

/**
 * Escapes one CSV field per RFC 4180: wrap in quotes when the value
 * contains a comma, quote, or newline; double any embedded quotes.
 */
function escapeCSVField(value: string): string {
    if (/[",\r\n]/.test(value)) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Builds a CSV string (with header row) from records.
 * @param columns Column names, in output order.
 * @param rows Records keyed by column name.
 */
export function toCSV(columns: string[], rows: Record<string, any>[]): string {
    const header = columns.map(col => escapeCSVField(col)).join(',');
    const lines = rows.map(row =>
        columns.map(col => escapeCSVField(formatCellForExport(row[col]))).join(',')
    );
    return [header, ...lines].join('\r\n');
}

/**
 * Builds a TSV string (tabs strip out of values) — pastes cleanly into
 * spreadsheet apps.
 */
export function toTSV(columns: string[], rows: Record<string, any>[]): string {
    const clean = (value: string) => value.replace(/[\t\r\n]+/g, ' ');
    const header = columns.map(clean).join('\t');
    const lines = rows.map(row =>
        columns.map(col => clean(formatCellForExport(row[col]))).join('\t')
    );
    return [header, ...lines].join('\n');
}

/**
 * Triggers a client-side download of a CSV file.
 */
export function downloadCSV(filename: string, csv: string): void {
    // BOM so Excel opens UTF-8 CSVs correctly
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}

/**
 * Copies text to the clipboard, falling back to a hidden textarea +
 * execCommand when the async clipboard API is unavailable (e.g. file://).
 * @returns Promise resolving to true on success.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // fall through to legacy path
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        return ok;
    } catch {
        return false;
    }
}
