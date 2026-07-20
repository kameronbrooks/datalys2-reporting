/**
 * Persistent per-visual view state, stored in the browser's localStorage.
 *
 * Runtime changes a user makes to a visual (hidden columns, sorting,
 * grouping, active tab, ...) are saved under a key scoped to this report and
 * the visual's `id`, and restored on the next load. Each visual offers a
 * "Reset view" action, and the report headbar offers a reset for the whole
 * report.
 *
 * The report is identified by (first match wins):
 * 1. <meta name="report-id" content="...">
 * 2. document.title
 * 3. location.pathname
 */
/** Window event fired whenever saved view state changes in this tab. */
export declare const STATE_CHANGED_EVENT = "dl2-state-changed";
/** The storage namespace for this report. */
export declare function getReportKey(): string;
/**
 * Loads the saved view state for a visual.
 * @returns The saved state object, or null when none exists (or storage is unavailable).
 */
export declare function loadVisualState<T = Record<string, any>>(visualId: string): T | null;
/**
 * Saves the view state for a visual (merged replace — pass the full state).
 */
export declare function saveVisualState(visualId: string, state: Record<string, any>): void;
/**
 * Removes the saved view state for one visual.
 */
export declare function clearVisualState(visualId: string): void;
/**
 * Removes ALL saved view state for this report.
 * @returns The number of entries removed.
 */
export declare function clearReportState(): number;
/**
 * Whether any view state is saved for this report.
 */
export declare function hasReportState(): boolean;
