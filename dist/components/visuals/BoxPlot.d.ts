import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
/**
 * Props for the BoxPlot component.
 * Supports two modes:
 * 1. Pre-calculated: Provide min, q1, median, q3, max columns.
 * 2. Raw Data: Provide a dataColumn and it will calculate the statistics.
 */
export interface BoxPlotProps extends ReportVisual {
    minColumn?: string | number;
    q1Column?: string | number;
    medianColumn?: string | number;
    q3Column?: string | number;
    maxColumn?: string | number;
    meanColumn?: string | number;
    dataColumn?: string | number;
    /** Column to group data by. */
    categoryColumn?: string | number;
    /** Orientation of the box plot. Defaults to 'vertical'. */
    direction?: 'horizontal' | 'vertical';
    /** Whether to show outliers as individual points. Defaults to true. */
    showOutliers?: boolean;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the boxes. */
    color?: ColorProperty;
}
/**
 * BoxPlot Component
 * Visualizes the distribution of data through quartiles.
 */
export declare const BoxPlot: React.FC<BoxPlotProps>;
