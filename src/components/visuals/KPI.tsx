import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "../../lib/types";
import { TrendIndicator } from "./TrendIndicator";
import { BreachIndicator, getBreachStatus, getBreachColor } from "./BreachIndicator";
import { Tooltip } from "./Tooltip";
import { findColumnIndex } from "../../lib/dataset-utility";
import { isDate, printDate } from "../../lib/date-utility";

export interface KPIProps extends ReportVisual {
    valueColumn?: string | number;
    comparisonColumn?: string | number;
    
    rowIndex?: number;
    
    format?: 'number' | 'currency' | 'percent' | 'date';
    currencySymbol?: string;
    
    goodDirection?: 'higher' | 'lower';
    breachValue?: number;
    warningValue?: number;
    
    title?: string;
    width?: number;
    height?: number;
}

export const KPI: React.FC<KPIProps> = ({
    valueColumn = 0,
    comparisonColumn = 1,
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

    const data = useMemo(() => {
        if (!dataset || !dataset.data[rowIndex]) return null;
        
        const valIdx = findColumnIndex(valueColumn, dataset);
        const comparisonIdx = comparisonColumn !== undefined ? findColumnIndex(comparisonColumn, dataset) : undefined;
        
        const row = dataset.data[rowIndex];

        const rawValue = valIdx !== undefined ? row[valIdx] : 0;
        const value = isDate(rawValue) ? rawValue.getTime() : Number(rawValue);
        const isDateValue = isDate(rawValue);

        const rawComparison = comparisonIdx !== undefined ? row[comparisonIdx] : undefined;
        const comparisonValue = isDate(rawComparison) ? rawComparison.getTime() : (rawComparison !== undefined ? Number(rawComparison) : undefined);
        
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
    }, [dataset, valueColumn, comparisonColumn, rowIndex]);

    if (!data) {
        return (
            <div className="dl2-kpi" style={{ padding: padding || 15, margin: margin || 10, border: border ? "1px solid var(--dl2-border-main)" : undefined }}>
                <div className="dl2-kpi-empty">No data</div>
            </div>
        );
    }

    const { value, change, comparisonValue, isDateValue } = data;

    // Helper function to format values consistently
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

    // Format Value
    const formattedValue = formatValue(value);

    // Breach Logic
    let valueColor = 'inherit';
    let breachIcon = null;
    let breachStatus = null;

    const changeAdjective = (change !== undefined) ? (change > 0 ? 'above' : (change < 0 ? 'below' : 'from')) : 'no data';
    const textSuffix = (comparisonColumn !== undefined) ? `${changeAdjective} ${comparisonColumn}` : undefined;

    if (breachValue !== undefined) {
        breachStatus = getBreachStatus(value, breachValue, warningValue, goodDirection);
        breachIcon = <BreachIndicator status={breachStatus} />;
    }

    // Build tooltip content
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
            
            <TrendIndicator change={change} goodDirection={goodDirection} textSuffix={textSuffix} />
            
            {description && <div className="dl2-kpi-desc" style={{ fontSize: '0.8em', color: 'var(--dl2-text-muted)', marginTop: 10, textAlign: 'center' }}>{description}</div>}
        </div>
    );
};
