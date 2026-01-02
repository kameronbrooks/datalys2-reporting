import React from "react";
import type { ReportVisual, ReportVisualElement, ColorProperty } from "../../lib/types";
/**
 * Props for the LineChart component.
 */
export interface LineChartProps extends ReportVisual {
    /** Additional visual elements like markers or trend lines. */
    otherElements?: ReportVisualElement[];
    /** Column for the X-axis (categories or time). */
    xColumn?: string | number;
    /** Column(s) for the Y-axis (numerical values). */
    yColumns?: string | string[];
    title?: string;
    width?: number;
    height?: number;
    /** Fixed minimum value for the Y-axis. */
    minY?: number;
    /** Fixed maximum value for the Y-axis. */
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the lines. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    legendTitle?: string;
    /** Whether to show value labels above points. Defaults to false. */
    showLabels?: boolean;
    /** Whether to use monotone cubic interpolation for smooth lines. Defaults to false. */
    smooth?: boolean;
}
/**
 * LineChart Component
 * Renders a multi-series line chart with optional smoothing and interactive points.
 */
export declare const LineChart: React.FC<LineChartProps>;
