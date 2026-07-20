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
export declare const NAVIGATE_EVENT = "dl2-navigate";
/** The navigation target currently being resolved (for late-mounting containers). */
export declare function getPendingNavigationTarget(): string | null;
/**
 * Returns true when the element (layout/visual/tab config) or any descendant
 * carries the given id.
 */
export declare function elementTreeContainsId(node: any, targetId: string): boolean;
/**
 * Finds the index of the page containing the visual id, or -1.
 */
export declare function findPageIndexForTarget(pages: ReportPage[], targetId: string): number;
/**
 * Announces a navigation request: sets the pending target (so containers
 * that mount later can pick it up) and notifies mounted containers.
 */
export declare function requestNavigation(targetId: string): void;
/**
 * Scrolls to the anchor element for a visual id, retrying while pages/tabs
 * mount. Flashes the element when found.
 */
export declare function scrollToVisual(targetId: string, attempts?: number, interval?: number): void;
