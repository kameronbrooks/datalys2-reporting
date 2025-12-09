import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "../../lib/types";

export interface KPIProps extends ReportVisual {
    valueColumn?: string | number;
    changeColumn?: string | number;
    
    rowIndex?: number;
    
    format?: 'number' | 'currency' | 'percent';
    currencySymbol?: string;
    
    goodDirection?: 'higher' | 'lower';
    breachValue?: number;
    
    title?: string;
    width?: number;
    height?: number;
}

export const KPI: React.FC<KPIProps> = ({
    valueColumn = 0,
    changeColumn,
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
    breachValue
}) => {
    const ctx = useContext(AppContext) || { datasets: {} };
    const dataset = ctx.datasets[datasetId];

    const findColumnIndex = (column: string | number, dataset: Dataset): number | undefined => {
        if (!dataset) return undefined;
        if ((typeof column === "number") && (column >= 0) && (column < dataset.columns.length)) {
            return column;
        } else if (typeof column === "string") {
            const colIndex = dataset.columns.indexOf(column);
            return colIndex >= 0 ? colIndex : 0;
        }
        return undefined;
    };

    const data = useMemo(() => {
        if (!dataset || !dataset.data[rowIndex]) return null;
        
        const valIdx = findColumnIndex(valueColumn, dataset);
        const changeIdx = changeColumn !== undefined ? findColumnIndex(changeColumn, dataset) : undefined;
        
        const row = dataset.data[rowIndex];
        
        return {
            value: valIdx !== undefined ? Number(row[valIdx]) : 0,
            change: changeIdx !== undefined ? Number(row[changeIdx]) : undefined
        };
    }, [dataset, valueColumn, changeColumn, rowIndex]);

    if (!data) {
        return (
            <div className="dl2-kpi" style={{ padding: padding || 15, margin: margin || 10, border: border ? "1px solid #ccc" : undefined }}>
                <div className="dl2-kpi-empty">No data</div>
            </div>
        );
    }

    const { value, change } = data;

    // Format Value
    let formattedValue = String(value);
    if (format === 'currency') {
        formattedValue = `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    } else if (format === 'percent') {
        formattedValue = `${(value * 100).toFixed(1)}%`;
    } else {
        formattedValue = value.toLocaleString();
    }

    // Trend Logic
    let trendColor = '#666'; // Grey for no change
    let Caret = null;
    
    if (change !== undefined && change !== 0) {
        const isPositive = change > 0;
        const isGood = goodDirection === 'higher' ? isPositive : !isPositive;
        
        trendColor = isGood ? '#2e7d32' : '#c62828'; // Green : Red
        
        if (isPositive) {
            Caret = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={trendColor} style={{ marginRight: 2 }}>
                    <path d="M7 14l5-5 5 5z" />
                </svg>
            );
        } else {
            Caret = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={trendColor} style={{ marginRight: 2 }}>
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            );
        }
    } else if (change === 0) {
        Caret = <span style={{ marginRight: 4 }}>-</span>;
    }

    // Breach Logic
    let valueColor = 'inherit';
    if (breachValue !== undefined) {
        const isBreached = goodDirection === 'higher' ? value < breachValue : value > breachValue;
        if (isBreached) {
            valueColor = '#c62828'; // Red if breached (bad)
        } else {
             valueColor = '#2e7d32'; // Green if good
        }
    }

    const containerStyle: React.CSSProperties = {
        padding: padding || 15,
        margin: margin || 10,
        border: border ? "1px solid #ccc" : undefined,
        boxShadow: shadow ? "2px 2px 5px rgba(0, 0, 0, 0.1)" : undefined,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#fff",
        minWidth: width || 150,
        minHeight: height || 100,
        flex: "1"
    };

    return (
        <div className="dl2-kpi" style={containerStyle}>
            {title && <div className="dl2-kpi-title" style={{ fontSize: '0.9em', color: '#666', marginBottom: 5, textAlign: 'center' }}>{title}</div>}
            
            <div className="dl2-kpi-value" style={{ fontSize: '2em', fontWeight: 'bold', color: valueColor }}>
                {formattedValue}
            </div>
            
            {change !== undefined && (
                <div className="dl2-kpi-trend" style={{ display: 'flex', alignItems: 'center', fontSize: '0.9em', color: trendColor, marginTop: 5 }}>
                    {Caret}
                    <span>{Math.abs(change * 100).toFixed(1)}%</span>
                </div>
            )}
            
            {description && <div className="dl2-kpi-desc" style={{ fontSize: '0.8em', color: '#999', marginTop: 10, textAlign: 'center' }}>{description}</div>}
        </div>
    );
};
