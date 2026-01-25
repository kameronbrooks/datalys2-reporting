import React from "react";
import type { ReportVisual, ReportVisualElement, ColorProperty } from "../../lib/types";
/**
 * Threshold configuration for pass/fail coloring.
 */
export interface ThresholdConfig {
    /** The threshold value to compare against. */
    value: number;
    /** Color for values that pass the threshold check. Defaults to green. */
    passColor?: string;
    /** Color for values that fail the threshold check. Defaults to red. */
    failColor?: string;
    /**
     * How to determine pass/fail:
     * - 'above': values >= threshold pass (default)
     * - 'below': values <= threshold pass
     * - 'equals': values === threshold pass
     */
    mode?: 'above' | 'below' | 'equals';
    /** Whether to show the threshold line on the chart. Defaults to true. */
    showLine?: boolean;
    /** Style for the threshold line. Defaults to 'dashed'. */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /**
     * Width of the color blend transition zone as a percentage of the chart width (0-50).
     * Higher values create a more gradual color transition. Defaults to 5.
     * Set to 0 for a hard edge at the threshold crossing.
     */
    blendWidth?: number;
}
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
    /**
     * Optional threshold configuration for pass/fail coloring.
     * When provided, lines and markers will be colored based on whether values pass or fail the threshold.
     * Lines will seamlessly blend colors at threshold crossing points.
     */
    threshold?: ThresholdConfig;
}
/**
 * LineChart Component
 * Renders a multi-series line chart with optional smoothing and interactive points.
 */
export declare const LineChart: React.FC<LineChartProps>;
