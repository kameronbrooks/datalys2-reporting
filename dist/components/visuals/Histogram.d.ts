import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
/**
 * Props for the Histogram component.
 */
export interface HistogramProps extends ReportVisual {
    /** Column to bin for the histogram. */
    column?: string | number;
    /** Number of bins to generate. Defaults to 10. */
    bins?: number;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the bars. */
    color?: ColorProperty;
    /** Whether to show frequency labels above bars. */
    showLabels?: boolean;
}
/**
 * Histogram Component
 * Visualizes the distribution of a numerical dataset by grouping values into bins.
 */
export declare const Histogram: React.FC<HistogramProps>;
