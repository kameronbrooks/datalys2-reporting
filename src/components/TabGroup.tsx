import React from "react";
import { ReportPage } from "../lib/types"
import { Page } from "./Page";

export interface TabGroupProps {
    pages: ReportPage[];
}

export const TabGroup: React.FC<TabGroupProps> = ({ pages }) => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    /**
     * Returns the appropriate shadow class for tabs adjacent to the active tab.
     * @param index 
     * @returns 
     */
    const getTabShadowClass = (index: number) => {
        if (index == activeIndex) {
            return " dl2-tab-inset-shadow-none";
        }
        else if (index == activeIndex-1) {
            return " dl2-tab-inset-shadow-right";
        } else if (index == activeIndex+1) {
            return " dl2-tab-inset-shadow-left";
        }
        return " dl2-tab-inset-shadow-bottom";
    }

    return (
        <div>
            <div className="dl2-tab-group">
                {pages.map((page, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={"dl2-tab" + (activeIndex === index ? " dl2-tab--active" : "") + getTabShadowClass(index)}
                    >
                        {page.title}
                    </div>
                ))}
                <div className="dl2-tab-group-remaining-border"></div>
            </div>
            <div>
                <Page page={pages[activeIndex]} />
            </div>
        </div>
    );
}