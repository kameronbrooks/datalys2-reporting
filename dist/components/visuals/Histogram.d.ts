import React from "react";
import type { ReportVisual } from "../../lib/types";
export interface HistogramProps extends ReportVisual {
    column?: string | number;
    bins?: number;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    color?: string;
    showLabels?: boolean;
}
export declare const Histogram: React.FC<HistogramProps>;
