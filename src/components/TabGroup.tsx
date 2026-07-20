import React from "react";
import { ReportPage } from "../lib/types"
import { Page } from "./Page";
import { TabStrip } from "./TabStrip";

export interface TabGroupProps {
    pages: ReportPage[];
}

export const TabGroup: React.FC<TabGroupProps> = ({ pages }) => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    return (
        <div>
            <TabStrip
                titles={pages.map(page => page.title)}
                activeIndex={activeIndex}
                onSelect={setActiveIndex}
            />
            <div>
                <Page page={pages[activeIndex]} />
            </div>
        </div>
    );
}
