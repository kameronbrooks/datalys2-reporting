import React from "react";
import type { ReportVisual, ColorProperty } from "../../lib/types";
export interface GaugeRange {
    from: number;
    to: number;
    color?: string;
    label?: string;
}
/**
 * Props for the Gauge component.
 */
export interface GaugeProps extends ReportVisual {
    /** Column name or index to use for the gauge value. Defaults to 0. */
    valueColumn?: string | number;
    /** Row index to read the value from. Defaults to 0. */
    rowIndex?: number;
    /** Minimum value for the gauge scale. Defaults to 0. */
    minValue?: number;
    /** Maximum value for the gauge scale. Defaults to 100. */
    maxValue?: number;
    /** Optional title for the gauge. */
    title?: string;
    /** Optional width for the gauge. */
    width?: number;
    /** Optional height for the gauge. */
    height?: number;
    /** Gauge arc thickness in pixels. */
    thickness?: number;
    /** Start angle in radians. Defaults to -3/4 PI. */
    startAngle?: number;
    /** End angle in radians. Defaults to 3/4 PI. */
    endAngle?: number;
    /** Color palette used for ranges and value arc. */
    colors?: ColorProperty;
    /** Range bands for the gauge (colored segments). */
    ranges?: GaugeRange[];
    /** Color for the track when ranges are not provided. */
    trackColor?: string;
    /** Color for the value arc when ranges are not provided. */
    valueColor?: string;
    /** Color of the needle. */
    needleColor?: string;
    /** Whether to show the needle. Defaults to true. */
    showNeedle?: boolean;
    /** Whether to show the center value. Defaults to true. */
    showValue?: boolean;
    /** Whether to show a legend for the ranges. Defaults to false. */
    showLegend?: boolean;
    /** Whether to show min/max labels. Defaults to true. */
    showMinMax?: boolean;
    /** Display format for the value. */
    format?: "number" | "currency" | "percent";
    /** Rounding precision for the value. */
    roundingPrecision?: number;
    /** Currency symbol to use when format is 'currency'. Defaults to '$'. */
    currencySymbol?: string;
    /** Optional unit to display under the value. */
    unit?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
}
export declare const Gauge: React.FC<GaugeProps>;
