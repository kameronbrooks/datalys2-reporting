import { ReportPage } from "./types";

/**
 * In-document navigation to visuals by id.
 *
 * Every visual with an `id` gets a DOM anchor. `navigateTo(id)` (exposed via
 * AppContext, used by the `link` visual and `#hash` links) switches to the
 * page containing the visual, lets any tab containers activate the right
 * tab, then scrolls to the element and flashes it.
 */

/** Window event dispatched when a navigation to a visual id is requested. */
export const NAVIGATE_EVENT = 'dl2-navigate';

/** css class applied briefly to the target element after navigation. */
const FLASH_CLASS = 'dl2-flash-highlight';

let pendingTarget: string | null = null;

/** The navigation target currently being resolved (for late-mounting containers). */
export function getPendingNavigationTarget(): string | null {
    return pendingTarget;
}

/**
 * Returns true when the element (layout/visual/tab config) or any descendant
 * carries the given id.
 */
export function elementTreeContainsId(node: any, targetId: string): boolean {
    if (!node || typeof node !== 'object') return false;
    if (node.id === targetId) return true;
    if (Array.isArray(node.children) && node.children.some((child: any) => elementTreeContainsId(child, targetId))) {
        return true;
    }
    if (Array.isArray(node.rows) && node.rows.some((row: any) => elementTreeContainsId(row, targetId))) {
        return true;
    }
    if (Array.isArray(node.tabs)) {
        return node.tabs.some((tab: any) =>
            (tab?.layout && elementTreeContainsId(tab.layout, targetId))
            || (Array.isArray(tab?.children) && tab.children.some((child: any) => elementTreeContainsId(child, targetId)))
        );
    }
    return false;
}

/**
 * Finds the index of the page containing the visual id, or -1.
 */
export function findPageIndexForTarget(pages: ReportPage[], targetId: string): number {
    return (pages || []).findIndex(page => elementTreeContainsId(page, targetId));
}

/**
 * Announces a navigation request: sets the pending target (so containers
 * that mount later can pick it up) and notifies mounted containers.
 */
export function requestNavigation(targetId: string): void {
    pendingTarget = targetId;
    try {
        window.dispatchEvent(new CustomEvent(NAVIGATE_EVENT, { detail: { targetId } }));
    } catch {
        // ignore
    }
}

/**
 * Scrolls to the anchor element for a visual id, retrying while pages/tabs
 * mount. Flashes the element when found.
 */
export function scrollToVisual(targetId: string, attempts: number = 20, interval: number = 100): void {
    const attempt = (remaining: number) => {
        const el = document.getElementById(targetId);
        if (el) {
            if (pendingTarget === targetId) pendingTarget = null;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.remove(FLASH_CLASS);
            // restart the animation if navigating to the same target again
            void el.offsetWidth;
            el.classList.add(FLASH_CLASS);
            window.setTimeout(() => el.classList.remove(FLASH_CLASS), 2000);
            return;
        }
        if (remaining > 0) {
            window.setTimeout(() => attempt(remaining - 1), interval);
        } else {
            if (pendingTarget === targetId) pendingTarget = null;
            console.warn(`[datalys2] Could not navigate to "${targetId}" — no element with that id was found.`);
        }
    };
    attempt(attempts);
}
