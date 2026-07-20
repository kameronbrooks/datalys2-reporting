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

const PREFIX = 'dl2state';

/** Window event fired whenever saved view state changes in this tab. */
export const STATE_CHANGED_EVENT = 'dl2-state-changed';

function notifyStateChanged(): void {
    try {
        window.dispatchEvent(new Event(STATE_CHANGED_EVENT));
    } catch {
        // ignore
    }
}

let cachedReportKey: string | null = null;

/** The storage namespace for this report. */
export function getReportKey(): string {
    if (cachedReportKey !== null) return cachedReportKey;
    const meta = document.querySelector('meta[name="report-id"]')?.getAttribute('content');
    const raw = meta || document.title || location.pathname || 'report';
    cachedReportKey = raw.trim().slice(0, 120);
    return cachedReportKey;
}

function storageKey(visualId: string): string {
    return `${PREFIX}:${getReportKey()}:${visualId}`;
}

function getStorage(): Storage | null {
    try {
        // Touch localStorage — throws in some privacy modes.
        const storage = window.localStorage;
        return storage;
    } catch {
        return null;
    }
}

/**
 * Loads the saved view state for a visual.
 * @returns The saved state object, or null when none exists (or storage is unavailable).
 */
export function loadVisualState<T = Record<string, any>>(visualId: string): T | null {
    const storage = getStorage();
    if (!storage || !visualId) return null;
    try {
        const raw = storage.getItem(storageKey(visualId));
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
}

/**
 * Saves the view state for a visual (merged replace — pass the full state).
 */
export function saveVisualState(visualId: string, state: Record<string, any>): void {
    const storage = getStorage();
    if (!storage || !visualId) return;
    try {
        storage.setItem(storageKey(visualId), JSON.stringify(state));
        notifyStateChanged();
    } catch {
        // Quota exceeded or serialization issue — persistence is best-effort.
    }
}

/**
 * Removes the saved view state for one visual.
 */
export function clearVisualState(visualId: string): void {
    const storage = getStorage();
    if (!storage || !visualId) return;
    try {
        storage.removeItem(storageKey(visualId));
        notifyStateChanged();
    } catch {
        // ignore
    }
}

/**
 * Removes ALL saved view state for this report.
 * @returns The number of entries removed.
 */
export function clearReportState(): number {
    const storage = getStorage();
    if (!storage) return 0;
    const prefix = `${PREFIX}:${getReportKey()}:`;
    const doomed: string[] = [];
    try {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(prefix)) doomed.push(key);
        }
        doomed.forEach(key => storage.removeItem(key));
        if (doomed.length > 0) notifyStateChanged();
    } catch {
        // ignore
    }
    return doomed.length;
}

/**
 * Whether any view state is saved for this report.
 */
export function hasReportState(): boolean {
    const storage = getStorage();
    if (!storage) return false;
    const prefix = `${PREFIX}:${getReportKey()}:`;
    try {
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith(prefix)) return true;
        }
    } catch {
        // ignore
    }
    return false;
}
