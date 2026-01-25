import React from "react";
import type { ReportVisual, ReportVisualElement, ColorProperty, ThresholdConfig } from "../../lib/types";
/**
 * Props for the AreaChart component.
 */
export interface AreaChartProps extends ReportVisual {
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
    /** Color or color palette for the areas. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    legendTitle?: string;
    /** Whether to show value labels above points. Defaults to false. */
    showLabels?: boolean;
    /** Whether to use monotone cubic interpolation for smooth curves. Defaults to false. */
    smooth?: boolean;
    /**
     * Optional threshold configuration for pass/fail coloring.
     * When provided, lines, areas, and markers will be colored based on whether values pass or fail the threshold.
     * Colors will seamlessly blend at threshold crossing points.
     */
    threshold?: ThresholdConfig;
    /**
     * Opacity of the area fill (0-1). Defaults to 0.3.
     * Set to 0 to hide the fill and show only the line.
     */
    fillOpacity?: number;
    /** Whether to show the line stroke on top of the area. Defaults to true. */
    showLine?: boolean;
    /** Whether to show interactive markers/points. Defaults to true. */
    showMarkers?: boolean;
}
/**
 * AreaChart Component
 * Renders a multi-series area chart with filled regions below the lines.
 * Supports threshold-based coloring with smooth gradient transitions.
 */
export declare const AreaChart: React.FC<AreaChartProps>;
