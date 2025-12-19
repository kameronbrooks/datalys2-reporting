import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
export interface PieChartDatum {
    id?: string;
    label: string;
    value: number;
    color?: string;
}
/**
 * Props for the PieChart component.
 * @interface PieChartProps
 * @extends ReportVisual
 * @property {string|number} [categoryColumn] - The column index or name for categories.
 * @property {string|number} [valueColumn] - The column index or name for values.
 * @property {string} [title] - The title of the pie chart.
 * @property {number} [width] - The width of the pie chart in pixels.
 * @property {number} [height] - The height of the pie chart in pixels.
 * @property {number} [innerRadius] - The inner radius of the pie chart (for donut charts).
 * @property {number} [cornerRadius] - The corner radius for pie slices.
 * @property {number} [padAngle] - The padding angle between pie slices.
 * @property {Partial<Record<"top" | "right" | "bottom" | "left", number>>} [chartMargin] - The margin around the chart area.
 * @property {string[]} [colors] - An array of colors to use for the pie slices.
 */
export interface PieChartProps extends ReportVisual {
    categoryColumn?: string | number;
    valueColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    innerRadius?: number;
    cornerRadius?: number;
    padAngle?: number;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: ColorProperty;
    showLegend?: boolean;
    legendTitle?: string;
}
export declare const PieChart: React.FC<PieChartProps>;
