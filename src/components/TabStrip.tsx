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
export const TabStrip: React.FC<TabStripProps> = ({ titles, activeIndex, onSelect }) => {
    /**
     * Returns the appropriate shadow class for tabs adjacent to the active tab.
     * @param index
     * @returns
     */
    const getTabShadowClass = (index: number) => {
        if (index == activeIndex) {
            return " dl2-tab-inset-shadow-none";
        }
        else if (index == activeIndex - 1) {
            return " dl2-tab-inset-shadow-right";
        } else if (index == activeIndex + 1) {
            return " dl2-tab-inset-shadow-left";
        }
        return " dl2-tab-inset-shadow-bottom";
    }

    return (
        <div className="dl2-tab-group">
            {titles.map((title, index) => (
                <div
                    key={index}
                    onClick={() => onSelect(index)}
                    className={"dl2-tab" + (activeIndex === index ? " dl2-tab--active" : "") + getTabShadowClass(index)}
                >
                    {title}
                </div>
            ))}
            <div className="dl2-tab-group-remaining-border"></div>
        </div>
    );
};
