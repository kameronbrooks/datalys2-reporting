import React, { useState } from "react";
import { Layout, LayoutElement } from "../../lib/types";
import { PageRow } from "../PageRow";
import { TabStrip } from "../TabStrip";
import { VisualContainer } from "./VisualContainer";

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
export const TabsVisual: React.FC<TabsVisualProps> = ({
    tabs,
    defaultTab = 0,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex
}) => {
    const validTabs = Array.isArray(tabs) ? tabs.filter(tab => tab && typeof tab === 'object') : [];
    const [activeIndex, setActiveIndex] = useState(
        Math.min(Math.max(defaultTab, 0), Math.max(validTabs.length - 1, 0))
    );

    if (validTabs.length === 0) {
        return (
            <VisualContainer padding={padding} margin={margin} border={border} shadow={shadow} flex={flex} title={title}>
                <div style={{ padding: 10, color: 'var(--dl2-error)' }}>
                    Tabs visual has no tabs. Add a "tabs" array with {'{ "title", "children" }'} entries.
                </div>
            </VisualContainer>
        );
    }

    const activeTab = validTabs[Math.min(activeIndex, validTabs.length - 1)];
    const activeLayout: Layout = activeTab.layout
        ?? { type: 'layout', direction: 'row', children: activeTab.children ?? [] };

    return (
        <VisualContainer
            padding={padding ?? 0}
            margin={margin}
            border={border}
            shadow={shadow}
            flex={flex}
            title={title}
            description={description}
        >
            <TabStrip
                titles={validTabs.map((tab, i) => tab.title || `Tab ${i + 1}`)}
                activeIndex={Math.min(activeIndex, validTabs.length - 1)}
                onSelect={setActiveIndex}
            />
            <div className="dl2-tabs-visual-body" style={{ display: 'flex', flex: 1, minWidth: 0 }}>
                <PageRow layout={activeLayout} />
            </div>
        </VisualContainer>
    );
};
