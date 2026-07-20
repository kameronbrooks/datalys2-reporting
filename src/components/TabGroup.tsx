import React from "react";
import { ReportPage } from "../lib/types"
import { Page } from "./Page";
import { TabStrip } from "./TabStrip";

export interface TabGroupProps {
    pages: ReportPage[];
    /** Controlled active page index (used by App for link navigation). */
    activeIndex?: number;
    /** Selection callback when controlled. */
    onSelect?: (index: number) => void;
}

export const TabGroup: React.FC<TabGroupProps> = ({ pages, activeIndex: controlledIndex, onSelect }) => {
    const [internalIndex, setInternalIndex] = React.useState(0);
    const activeIndex = controlledIndex ?? internalIndex;
    const handleSelect = (index: number) => {
        if (onSelect) {
            onSelect(index);
        } else {
            setInternalIndex(index);
        }
    };

    return (
        <div>
            <TabStrip
                titles={pages.map(page => page.title)}
                activeIndex={activeIndex}
                onSelect={handleSelect}
            />
            <div>
                <Page page={pages[activeIndex]} />
            </div>
        </div>
    );
}
