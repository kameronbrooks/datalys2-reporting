import React from "react";
import type { ReportVisual, ReportVisualElement, ColorProperty } from "../../lib/types";
/**
 * Props for the ClusteredBarChart component.
 */
export interface ClusteredBarChartProps extends ReportVisual {
    /** Additional visual elements like markers or trend lines. */
    otherElements?: ReportVisualElement[];
    /** Column to use for the X-axis (categories). */
    xColumn?: string | number;
    /** Column(s) to use for the Y-axis (values). Multiple columns create clusters. */
    yColumns?: string | string[];
    title?: string;
    width?: number;
    height?: number;
    /** Minimum value for the Y-axis. Defaults to 0. */
    minY?: number;
    /** Maximum value for the Y-axis. If not provided, calculated from data. */
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the bars. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    /** Optional title for the legend. */
    legendTitle?: string;
    /** Whether to show value labels inside the bars. Defaults to false. */
    showLabels?: boolean;
}
/**
 * ClusteredBarChart Component
 * Renders a bar chart where multiple series are grouped (clustered) for each category.
 */
export declare const ClusteredBarChart: React.FC<ClusteredBarChartProps>;
