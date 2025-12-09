import React, { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "@/types";
import { TrendIndicator } from "./TrendIndicator";
import { BreachIndicator, getBreachStatus, getBreachColor } from "./BreachIndicator";
import { findColumnIndex } from '@/dataset-utility'

export interface KPIProps extends ReportVisual {
    valueColumn?: string | number;
    comparisonColumn?: string | number;
    
    rowIndex?: number;
    
    format?: 'number' | 'currency' | 'percent';
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

        const value = valIdx !== undefined ? Number(row[valIdx]) : 0;
        const comparisonValue = comparisonIdx !== undefined ? Number(row[comparisonIdx]) : undefined;
        let change: number | undefined = undefined;
        if (comparisonValue !== undefined && comparisonValue !== 0) {
            change = (value - comparisonValue) / Math.abs(comparisonValue);
        }
        
        return {
            value: value,
            change: change,
            comparisonValue: comparisonValue
        };
    }, [dataset, valueColumn, comparisonColumn, rowIndex]);

    if (!data) {
        return (
            <div className="dl2-kpi" style={{ padding: padding || 15, margin: margin || 10, border: border ? "1px solid #ccc" : undefined }}>
                <div className="dl2-kpi-empty">No data</div>
            </div>
        );
    }

    const { value, change, comparisonValue } = data;

    // Format Value
    let formattedValue = String(value);
    if (format === 'currency') {
        formattedValue = `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    } else if (format === 'percent') {
        formattedValue = `${(value * 100).toFixed(1)}%`;
    } else {
        formattedValue = value.toLocaleString();
    }

    // Breach Logic
    let valueColor = 'inherit';
    let breachIcon = null;

    const changeAdjective = (change !== undefined) ? (change > 0 ? 'above' : (change < 0 ? 'below' : '')) : 'no data';
    const textSuffix = (comparisonColumn !== undefined) ? `${changeAdjective} ${comparisonColumn}` : undefined;

    if (breachValue !== undefined) {
        breachIcon = <BreachIndicator status={getBreachStatus(value, breachValue, warningValue, goodDirection)} />;
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
            {title && <div className="dl2-kpi-title" style={{ fontSize: '1.1em', fontWeight: 700, color: '#333', marginBottom: 5, textAlign: 'center' }}>{title}</div>}
            
            <div className="dl2-kpi-value" style={{ fontSize: '2em', fontWeight: 'bold', color: valueColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {formattedValue}
                {breachIcon}
            </div>
            
            <TrendIndicator change={change} goodDirection={goodDirection} textSuffix={textSuffix} />
            
            {description && <div className="dl2-kpi-desc" style={{ fontSize: '0.8em', color: '#999', marginTop: 10, textAlign: 'center' }}>{description}</div>}
        </div>
    );
};
