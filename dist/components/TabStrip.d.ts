import React from "react";
export interface TabStripProps {
    titles: string[];
    activeIndex: number;
    onSelect: (index: number) => void;
}
/**
 * The tab-header strip used by the page-level TabGroup and the 'tabs'
 * container visual. Renders the titles and highlights the active tab.
 */
export declare const TabStrip: React.FC<TabStripProps>;
