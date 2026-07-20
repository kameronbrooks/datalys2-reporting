import React from "react";
import { Layout, LayoutElement } from "../../lib/types";
/**
 * A single tab in a 'tabs' container visual. Provide either:
 * - `children`: an array of visuals/layouts (rendered as a row), or
 * - `layout`: a full Layout object for complete control.
 */
export interface TabsVisualTab {
    title: string;
    layout?: Layout;
    children?: LayoutElement[];
}
export interface TabsVisualProps extends LayoutElement {
    tabs: TabsVisualTab[];
    /** Index of the tab shown initially. Default 0. */
    defaultTab?: number;
    title?: string;
    description?: string;
}
/**
 * Container visual that shows one child view at a time behind a tab strip.
 * Usable anywhere a visual can go, e.g. a row can contain a tab group that
 * switches between different visuals. Tabs may contain any layout/visual
 * config, including nested tab groups.
 *
 * Inactive tabs are unmounted, so charts re-measure correctly each time
 * their tab becomes visible.
 */
export declare const TabsVisual: React.FC<TabsVisualProps>;
