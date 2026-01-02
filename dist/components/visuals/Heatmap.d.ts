import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
/**
 * Props for the Heatmap component.
 */
export interface HeatmapProps extends ReportVisual {
    /** Column for the X-axis categories. */
    xColumn?: string | number;
    /** Column for the Y-axis categories. */
    yColumn?: string | number;
    /** Column for the cell values (determines color intensity). */
    valueColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Optional fixed minimum value for the color scale. */
    minValue?: number;
    /** Optional fixed maximum value for the color scale. */
    maxValue?: number;
    /** Whether to show labels for X and Y axes. Defaults to true. */
    showAxisLabels?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Whether to show the value inside each cell. Defaults to false. */
    showCellLabels?: boolean;
    /** Optional formatter for cell labels. */
    cellLabelFormatter?: (value: number) => string;
    /** Text to show when no data is available. */
    emptyLabel?: string;
    /** Color or color interpolator for the heatmap. */
    color?: ColorProperty;
}
/**
 * Heatmap Component
 * Renders a grid where cell colors represent values across two categorical dimensions.
 */
export declare const Heatmap: React.FC<HeatmapProps>;
