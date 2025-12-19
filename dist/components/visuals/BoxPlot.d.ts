import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
export interface BoxPlotProps extends ReportVisual {
    minColumn?: string | number;
    q1Column?: string | number;
    medianColumn?: string | number;
    q3Column?: string | number;
    maxColumn?: string | number;
    meanColumn?: string | number;
    dataColumn?: string | number;
    categoryColumn?: string | number;
    direction?: 'horizontal' | 'vertical';
    showOutliers?: boolean;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    color?: ColorProperty;
}
export declare const BoxPlot: React.FC<BoxPlotProps>;
