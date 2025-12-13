import React from "react";
import type { ReportVisual } from "../../lib/types";
export interface ScatterPlotProps extends ReportVisual {
    xColumn?: string | number;
    yColumn?: string | number;
    categoryColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: string[];
    showLegend?: boolean;
    legendTitle?: string;
    pointSize?: number;
    showTrendline?: boolean;
    showCorrelation?: boolean;
}
export declare const ScatterPlot: React.FC<ScatterPlotProps>;
