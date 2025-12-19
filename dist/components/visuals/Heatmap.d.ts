import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
export interface HeatmapProps extends ReportVisual {
    xColumn?: string | number;
    yColumn?: string | number;
    valueColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    minValue?: number;
    maxValue?: number;
    showAxisLabels?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showCellLabels?: boolean;
    cellLabelFormatter?: (value: number) => string;
    emptyLabel?: string;
    color?: ColorProperty;
}
export declare const Heatmap: React.FC<HeatmapProps>;
