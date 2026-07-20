import React from "react";
import { ReportPage } from "../lib/types";
export interface TabGroupProps {
    pages: ReportPage[];
    /** Controlled active page index (used by App for link navigation). */
    activeIndex?: number;
    /** Selection callback when controlled. */
    onSelect?: (index: number) => void;
}
export declare const TabGroup: React.FC<TabGroupProps>;
