import React from "react";
import type { ReportVisual, ReportVisualElement, ColorProperty } from "../../lib/types";
export interface ScatterPlotProps extends ReportVisual {
    otherElements?: ReportVisualElement[];
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
    colors?: ColorProperty;
    showLegend?: boolean;
    legendTitle?: string;
    pointSize?: number;
    showTrendline?: boolean;
    showCorrelation?: boolean;
}
export declare const ScatterPlot: React.FC<ScatterPlotProps>;
