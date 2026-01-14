import React from "react";
import type { ReportVisual } from "../../lib/types";
/**
 * Props for the KPI component.
 * Extends ReportVisual to include common visual properties.
 */
export interface KPIProps extends ReportVisual {
    /** The column name or index to use for the primary value. Defaults to 0. */
    valueColumn?: string | number;
    /** The column name or index to use for comparison. */
    comparisonColumn?: string | number;
    /** The row index to use for comparison. If not provided, uses the same row as valueColumn. */
    comparisonRowIndex?: number;
    /** The comparison text to show alongside the comparison value. Ex. ("Last Month", "Yesterday", etc.) */
    comparisonText?: string;
    /** The row index to use for the primary value. Defaults to 0. */
    rowIndex?: number;
    /** Formatting style for the value. */
    format?: 'number' | 'currency' | 'percent' | 'date' | 'hms';
    /** Rounding precision for the value. */
    roundingPrecision?: number;
    /** Currency symbol to use when format is 'currency'. Defaults to '$'. */
    currencySymbol?: string;
    /** Defines whether a higher or lower value is considered 'good'. Defaults to 'higher'. */
    goodDirection?: 'higher' | 'lower';
    /** The threshold value that triggers a breach status. */
    breachValue?: number;
    /** The threshold value that triggers a warning status. */
    warningValue?: number;
    /** Optional title for the KPI card. */
    title?: string;
    /** Optional width for the KPI card. */
    width?: number;
    /** Optional height for the KPI card. */
    height?: number;
}
/**
 * KPI Component
 * Displays a single key performance indicator with optional comparison and breach status.
 */
export declare const KPI: React.FC<KPIProps>;
