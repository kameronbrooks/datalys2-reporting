import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "../../lib/types";
import { TrendIndicator } from "./TrendIndicator";
import { BreachIndicator, getBreachStatus, getBreachColor } from "./BreachIndicator";
import { Tooltip } from "./Tooltip";
import { findColumnIndex } from "../../lib/dataset-utility";
import { isDate, printDate } from "../../lib/date-utility";

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
    format?: 'number' | 'currency' | 'percent' | 'date';
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
export const KPI: React.FC<KPIProps> = ({
    valueColumn = 0,
    comparisonColumn,
    comparisonRowIndex,
    comparisonText,
    rowIndex = 0,
    datasetId,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    width,
    height,
    format = 'number',
    currencySymbol = '$',
    goodDirection = 'higher',
    breachValue,
    warningValue
}) => {
    const ctx = useContext(AppContext) || { datasets: {} };
    const dataset = ctx.datasets[datasetId];

    // Process data to extract value, comparison, and change
    const data = useMemo(() => {
        if (!dataset || !Array.isArray(dataset.data) || dataset.data.length === 0) return null;

        // Helper to handle negative indices (e.g., -1 for last row)
        const resolveRowIndex = (index: number, length: number): number => {
            if (index < 0) return length + index;
            return index;
        };

        const resolvedRowIndex = resolveRowIndex(rowIndex, dataset.data.length);
        if (resolvedRowIndex < 0 || resolvedRowIndex >= dataset.data.length) return null;

        const resolvedComparisonRowIndex =
            comparisonRowIndex === undefined
                ? undefined
                : resolveRowIndex(comparisonRowIndex, dataset.data.length);

        if (
            resolvedComparisonRowIndex !== undefined &&
            (resolvedComparisonRowIndex < 0 || resolvedComparisonRowIndex >= dataset.data.length)
        ) {
            return null;
        }
        
        const valIdx = findColumnIndex(valueColumn, dataset);
        const comparisonIdx = comparisonColumn !== undefined ? findColumnIndex(comparisonColumn, dataset) : valIdx;
        
        const row = dataset.data[resolvedRowIndex];
        const comparisonRow = (resolvedComparisonRowIndex !== undefined) ? dataset.data[resolvedComparisonRowIndex] : row;

        if (!row || !comparisonRow) return null;

        const rawValue = valIdx !== undefined ? row[valIdx] : 0;
        const value = isDate(rawValue) ? rawValue.getTime() : Number(rawValue);
        const isDateValue = isDate(rawValue);

        let comparisonValue = undefined;
        if (comparisonRowIndex !== undefined ||  comparisonColumn !== undefined) {
            const rawComparison = comparisonIdx !== undefined ? comparisonRow[comparisonIdx] : undefined;
            comparisonValue = isDate(rawComparison) ? rawComparison.getTime() : (rawComparison !== undefined ? Number(rawComparison) : undefined);
        }
        
        // Calculate percentage change if comparison value exists
        let change: number | undefined = undefined;
        if (comparisonValue !== undefined && comparisonValue !== 0 && !isDateValue) {
            change = (value - comparisonValue) / Math.abs(comparisonValue);
        }
        
        return {
            value: value,
            change: change,
            comparisonValue: comparisonValue,
            isDateValue: isDateValue
        };
    }, [dataset, valueColumn, comparisonColumn, comparisonRowIndex, rowIndex]);

    // Render empty state if no data is available
    if (!data) {
        return (
            <div className="dl2-kpi" style={{ padding: padding || 15, margin: margin || 10, border: border ? "1px solid var(--dl2-border-main)" : undefined }}>
                <div className="dl2-kpi-empty">No data</div>
            </div>
        );
    }

    const { value, change, comparisonValue, isDateValue } = data;

    /**
     * Helper function to format values consistently based on the 'format' prop.
     */
    const formatValue = (val: number): string => {
        if (isDateValue || format === 'date') {
            return printDate(new Date(val));
        }
        if (format === 'currency') {
            return `${currencySymbol}${val.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
        } else if (format === 'percent') {
            return `${(val * 100).toFixed(1)}%`;
        } else {
            return val.toLocaleString();
        }
    };

    const formattedValue = formatValue(value);

    // Determine breach status and icon
    let valueColor = 'inherit';
    let breachIcon = null;
    let breachStatus = null;

    const changeAdjective = (change !== undefined) ? (change > 0 ? 'above' : (change < 0 ? 'below' : 'from')) : 'no data';
    const comparisonDisplay = comparisonText && comparisonColumn;
    const textSuffix = comparisonDisplay ? `${changeAdjective} ${comparisonText}` : undefined;

    if (breachValue !== undefined) {
        breachStatus = getBreachStatus(value, breachValue, warningValue, goodDirection);
        breachIcon = <BreachIndicator status={breachStatus} />;
    }

    // Build tooltip content with detailed breakdown
    const tooltipContent = useMemo(() => {
        const lines: string[] = [];
        
        lines.push(`Value: ${formattedValue}`);
        
        if (comparisonValue !== undefined) {
            lines.push(`Comparison: ${formatValue(comparisonValue)}`);
        }
        
        if (change !== undefined) {
            const changePercent = (change * 100).toFixed(1);
            lines.push(`Change: ${change >= 0 ? '+' : ''}${changePercent}%`);
        }
        
        if (breachValue !== undefined) {
            lines.push(`Breach Threshold: ${formatValue(breachValue)}`);
        }
        
        if (warningValue !== undefined) {
            lines.push(`Warning Threshold: ${formatValue(warningValue)}`);
        }
        
        if (breachStatus) {
            const statusText = breachStatus === 'breach' ? '⚠️ BREACHED' : 
                             breachStatus === 'warning' ? '⚡ WARNING' : 
                             '✓ Good';
            lines.push(`Status: ${statusText}`);
        }
        
        return lines.join('\n');
    }, [value, comparisonValue, change, breachValue, warningValue, breachStatus, formattedValue, format, currencySymbol]);

    const containerStyle: React.CSSProperties = {
        padding: padding || 15,
        margin: margin || 10,
        border: border ? "1px solid var(--dl2-border-main)" : undefined,
        boxShadow: shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "var(--dl2-bg-visual)",
        minWidth: width || 150,
        minHeight: height || 100,
        flex: "1"
    };

    return (
        <div className="dl2-kpi" style={containerStyle}>
            {title && <div className="dl2-kpi-title" style={{ fontSize: '1.1em', fontWeight: 700, color: 'var(--dl2-text-main)', marginBottom: 5, textAlign: 'center' }}>{title}</div>}
            
            <Tooltip content={tooltipContent}>
                <div className="dl2-kpi-value" style={{ fontSize: '2em', fontWeight: 'bold', color: valueColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'help' }}>
                    {formattedValue}
                    {breachIcon}
                </div>
            </Tooltip>
            
            {/* Display trend indicator if change is available */}
            {change !== undefined && !Number.isNaN(change) && (
                <TrendIndicator change={change} goodDirection={goodDirection} textSuffix={textSuffix} />
            )}
            
            {description && <div className="dl2-kpi-desc" style={{ fontSize: '0.8em', color: 'var(--dl2-text-muted)', marginTop: 10, textAlign: 'center' }}>{description}</div>}
        </div>
    );
};
