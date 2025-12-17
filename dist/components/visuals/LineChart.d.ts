import React from "react";
import type { ReportVisual, ReportVisualElement } from "../../lib/types";
export interface LineChartProps extends ReportVisual {
    otherElements?: ReportVisualElement[];
    xColumn?: string | number;
    yColumns?: string | string[];
    title?: string;
    width?: number;
    height?: number;
    minY?: number;
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: string[];
    showLegend?: boolean;
    legendTitle?: string;
    showLabels?: boolean;
}
export declare const LineChart: React.FC<LineChartProps>;
