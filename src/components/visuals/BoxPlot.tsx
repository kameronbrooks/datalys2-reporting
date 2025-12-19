import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleLinear, scaleBand, min, max, quantile, ascending } from "d3";
import type { ReportVisual, Dataset, ColorProperty } from "../../lib/types";
import { findColumnIndex } from "../../lib/dataset-utility";
import { resolveColors, getColor } from "../../lib/color-utility";

export interface BoxPlotProps extends ReportVisual {
    // Mode 1: Pre-calculated
    minColumn?: string | number;
    q1Column?: string | number;
    medianColumn?: string | number;
    q3Column?: string | number;
    maxColumn?: string | number;
    meanColumn?: string | number;
    
    // Mode 2: Raw Data
    dataColumn?: string | number;
    
    // Common
    categoryColumn?: string | number;
    
    direction?: 'horizontal' | 'vertical';
    showOutliers?: boolean;
    
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    color?: ColorProperty;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

interface BoxPlotData {
    category: string;
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    mean?: number;
    outliers: number[];
}

export const BoxPlot: React.FC<BoxPlotProps> = ({
    datasetId,
    minColumn,
    q1Column,
    medianColumn,
    q3Column,
    maxColumn,
    meanColumn,
    dataColumn,
    categoryColumn,
    direction = 'vertical',
    showOutliers = true,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
    width = 600,
    height = 400,
    xAxisLabel,
    yAxisLabel,
    chartMargin,
    color = "#69b3a2"
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredItem, setHoveredItem] = useState<BoxPlotData | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            if (!entries || entries.length === 0) return;
            const { width } = entries[0].contentRect;
            setChartWidth(width);
        });

        resizeObserver.observe(containerRef.current);

        return () => resizeObserver.disconnect();
    }, []);

    const ctx = useContext(AppContext) || { datasets: {} };
    const dataset = ctx.datasets[datasetId];

    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    const resolvedColors = useMemo(() => resolveColors(color), [color]);

    const processedData: BoxPlotData[] = useMemo(() => {
        if (!dataset) return [];

        // Mode 2: Raw Data Calculation
        if (dataColumn !== undefined) {
            const dataColIdx = findColumnIndex(dataColumn, dataset);
            if (dataColIdx === undefined) return [];

            const catColIdx = categoryColumn !== undefined ? findColumnIndex(categoryColumn, dataset) : undefined;
            const dataColName = dataset.columns[dataColIdx];
            const catColName = catColIdx !== undefined ? dataset.columns[catColIdx] : undefined;

            const groups = new Map<string, number[]>();

            dataset.data.forEach(row => {
                const val = Array.isArray(row) ? row[dataColIdx] : row[dataColName];
                const numVal = typeof val === 'number' ? val : parseFloat(val);
                
                if (isNaN(numVal)) return;

                let cat = "All";
                if (catColIdx !== undefined) {
                    cat = Array.isArray(row) ? row[catColIdx] : row[catColName!];
                    cat = String(cat);
                }

                if (!groups.has(cat)) groups.set(cat, []);
                groups.get(cat)!.push(numVal);
            });

            const results: BoxPlotData[] = [];
            groups.forEach((values, category) => {
                values.sort(ascending);
                const minVal = min(values) || 0;
                const maxVal = max(values) || 0;
                const q1 = quantile(values, 0.25) || 0;
                const median = quantile(values, 0.5) || 0;
                const q3 = quantile(values, 0.75) || 0;
                const meanVal = values.reduce((a, b) => a + b, 0) / values.length;

                let whiskerMin = minVal;
                let whiskerMax = maxVal;
                let outliers: number[] = [];

                if (showOutliers) {
                    const iqr = q3 - q1;
                    const lowerFence = q1 - 1.5 * iqr;
                    const upperFence = q3 + 1.5 * iqr;

                    whiskerMin = min(values.filter(d => d >= lowerFence)) || minVal;
                    whiskerMax = max(values.filter(d => d <= upperFence)) || maxVal;
                    outliers = values.filter(d => d < lowerFence || d > upperFence);
                }

                results.push({
                    category,
                    min: whiskerMin,
                    q1,
                    median,
                    q3,
                    max: whiskerMax,
                    mean: meanVal,
                    outliers
                });
            });
            return results;
        } 
        // Mode 1: Pre-calculated
        else if (minColumn !== undefined && q1Column !== undefined && medianColumn !== undefined && q3Column !== undefined && maxColumn !== undefined) {
            const minIdx = findColumnIndex(minColumn, dataset);
            const q1Idx = findColumnIndex(q1Column, dataset);
            const medianIdx = findColumnIndex(medianColumn, dataset);
            const q3Idx = findColumnIndex(q3Column, dataset);
            const maxIdx = findColumnIndex(maxColumn, dataset);
            const meanIdx = meanColumn !== undefined ? findColumnIndex(meanColumn, dataset) : undefined;
            const catIdx = categoryColumn !== undefined ? findColumnIndex(categoryColumn, dataset) : undefined;

            if (minIdx === undefined || q1Idx === undefined || medianIdx === undefined || q3Idx === undefined || maxIdx === undefined) return [];

            return dataset.data.map((row, i) => {
                const getValue = (idx: number) => {
                    const val = Array.isArray(row) ? row[idx] : row[dataset.columns[idx]];
                    return typeof val === 'number' ? val : parseFloat(val);
                };

                const category = catIdx !== undefined 
                    ? String(Array.isArray(row) ? row[catIdx] : row[dataset.columns[catIdx]])
                    : `Row ${i + 1}`;

                return {
                    category,
                    min: getValue(minIdx),
                    q1: getValue(q1Idx),
                    median: getValue(medianIdx),
                    q3: getValue(q3Idx),
                    max: getValue(maxIdx),
                    mean: meanIdx !== undefined ? getValue(meanIdx) : undefined,
                    outliers: [] // No outliers in pre-calc mode
                };
            });
        }

        return [];
    }, [dataset, dataColumn, categoryColumn, minColumn, q1Column, medianColumn, q3Column, maxColumn, meanColumn, showOutliers]);

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);

    const { xScale, yScale } = useMemo<{xScale: any, yScale: any}>(() => {
        if (processedData.length === 0) {
            return { xScale: null, yScale: null };
        }

        const allValues = processedData.flatMap(d => [d.min, d.max, ...d.outliers]);
        const minValue = min(allValues) || 0;
        const maxValue = max(allValues) || 0;
        // Add some padding to the value domain
        const valuePadding = (maxValue - minValue) * 0.05;
        const valueDomain = [minValue - valuePadding, maxValue + valuePadding];

        const categories = processedData.map(d => d.category);

        if (direction === 'vertical') {
            const x = scaleBand()
                .domain(categories)
                .range([0, innerWidth])
                .padding(0.4);
            
            const y = scaleLinear()
                .domain(valueDomain)
                .range([innerHeight, 0]);
            
            return { xScale: x, yScale: y };
        } else {
            const x = scaleLinear()
                .domain(valueDomain)
                .range([0, innerWidth]);
            
            const y = scaleBand()
                .domain(categories)
                .range([0, innerHeight])
                .padding(0.4);

            return { xScale: x, yScale: y };
        }
    }, [processedData, innerWidth, innerHeight, direction]);

    const containerStyle: React.CSSProperties = {
        padding: padding || 10,
        margin: margin || 10,
        border: border ? "1px solid #ccc" : undefined,
        boxShadow: shadow ? "2px 2px 5px rgba(0, 0, 0, 0.1)" : undefined,
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        flex: flex || "1",
        width: '100%',
        position: 'relative'
    };

    if (!dataset || processedData.length === 0 || !xScale || !yScale) {
        return (
            <div className="dl2-box-plot dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available or invalid configuration.</div>
            </div>
        );
    }

    return (
        <div 
            className="dl2-box-plot dl2-visual-container"
            ref={containerRef}
            style={containerStyle}
        >
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}
            
            <svg className="dl2-chart-svg" width={chartWidth} height={height}>
                <g transform={`translate(${resolvedMargin.left},${resolvedMargin.top})`}>
                    {/* Axes */}
                    {direction === 'vertical' ? (
                        <>
                            {/* Y Axis */}
                            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="black" />
                            {yScale.ticks && yScale.ticks(5).map((tick: any, i: number) => (
                                <g key={i} transform={`translate(0,${yScale(tick)})`}>
                                    <line x1={-5} y1={0} x2={0} y2={0} stroke="black" />
                                    <text x={-10} y={5} textAnchor="end" fontSize={10}>{tick}</text>
                                </g>
                            ))}
                            {yAxisLabel && (
                                <text 
                                    transform={`rotate(-90)`} 
                                    x={-innerHeight / 2} 
                                    y={-35} 
                                    textAnchor="middle" 
                                    fontSize={12}
                                >
                                    {yAxisLabel}
                                </text>
                            )}

                            {/* X Axis */}
                            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="black" />
                            {processedData.map((d, i) => (
                                <g key={i} transform={`translate(${xScale(d.category)! + xScale.bandwidth() / 2},${innerHeight})`}>
                                    <line x1={0} y1={0} x2={0} y2={5} stroke="black" />
                                    <text x={0} y={20} textAnchor="middle" fontSize={10}>{d.category}</text>
                                </g>
                            ))}
                            {xAxisLabel && (
                                <text 
                                    x={innerWidth / 2} 
                                    y={innerHeight + 40} 
                                    textAnchor="middle" 
                                    fontSize={12}
                                >
                                    {xAxisLabel}
                                </text>
                            )}
                        </>
                    ) : (
                        <>
                            {/* X Axis (Values) */}
                            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="black" />
                            {xScale.ticks && xScale.ticks(5).map((tick: any, i: number) => (
                                <g key={i} transform={`translate(${xScale(tick)},${innerHeight})`}>
                                    <line x1={0} y1={0} x2={0} y2={5} stroke="black" />
                                    <text x={0} y={20} textAnchor="middle" fontSize={10}>{tick}</text>
                                </g>
                            ))}
                            {xAxisLabel && (
                                <text 
                                    x={innerWidth / 2} 
                                    y={innerHeight + 40} 
                                    textAnchor="middle" 
                                    fontSize={12}
                                >
                                    {xAxisLabel}
                                </text>
                            )}

                            {/* Y Axis (Categories) */}
                            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="black" />
                            {processedData.map((d, i) => (
                                <g key={i} transform={`translate(0,${yScale(d.category)! + yScale.bandwidth() / 2})`}>
                                    <line x1={-5} y1={0} x2={0} y2={0} stroke="black" />
                                    <text x={-10} y={5} textAnchor="end" fontSize={10}>{d.category}</text>
                                </g>
                            ))}
                            {yAxisLabel && (
                                <text 
                                    transform={`rotate(-90)`} 
                                    x={-innerHeight / 2} 
                                    y={-resolvedMargin.left + 15} 
                                    textAnchor="middle" 
                                    fontSize={12}
                                >
                                    {yAxisLabel}
                                </text>
                            )}
                        </>
                    )}

                    {/* Boxes */}
                    {processedData.map((d, i) => {
                        const bandWidth = direction === 'vertical' ? xScale.bandwidth() : yScale.bandwidth();
                        const center = direction === 'vertical' 
                            ? xScale(d.category)! + bandWidth / 2 
                            : yScale(d.category)! + bandWidth / 2;
                        
                        const q1Pos = direction === 'vertical' ? yScale(d.q1) : xScale(d.q1);
                        const q3Pos = direction === 'vertical' ? yScale(d.q3) : xScale(d.q3);
                        const minPos = direction === 'vertical' ? yScale(d.min) : xScale(d.min);
                        const maxPos = direction === 'vertical' ? yScale(d.max) : xScale(d.max);
                        const medianPos = direction === 'vertical' ? yScale(d.median) : xScale(d.median);
                        
                        const boxStart = direction === 'vertical' ? q3Pos : q1Pos;
                        const boxSize = Math.abs(q3Pos - q1Pos);

                        return (
                            <g 
                                key={i} 
                                onMouseEnter={(e) => {
                                    setHoveredItem(d);
                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                }}
                                onMouseMove={(e) => {
                                    setTooltipPos({ x: e.clientX, y: e.clientY });
                                }}
                                onMouseLeave={() => {
                                    setHoveredItem(null);
                                    setTooltipPos(null);
                                }}
                            >
                                {/* Whisker Line */}
                                <line 
                                    x1={direction === 'vertical' ? center : minPos} 
                                    y1={direction === 'vertical' ? minPos : center} 
                                    x2={direction === 'vertical' ? center : maxPos} 
                                    y2={direction === 'vertical' ? maxPos : center} 
                                    stroke="black" 
                                />
                                {/* Whisker Caps */}
                                <line 
                                    x1={direction === 'vertical' ? center - bandWidth/4 : minPos} 
                                    y1={direction === 'vertical' ? minPos : center - bandWidth/4} 
                                    x2={direction === 'vertical' ? center + bandWidth/4 : minPos} 
                                    y2={direction === 'vertical' ? minPos : center + bandWidth/4} 
                                    stroke="black" 
                                />
                                <line 
                                    x1={direction === 'vertical' ? center - bandWidth/4 : maxPos} 
                                    y1={direction === 'vertical' ? maxPos : center - bandWidth/4} 
                                    x2={direction === 'vertical' ? center + bandWidth/4 : maxPos} 
                                    y2={direction === 'vertical' ? maxPos : center + bandWidth/4} 
                                    stroke="black" 
                                />

                                {/* Box */}
                                <rect
                                    x={direction === 'vertical' ? center - bandWidth/2 : boxStart}
                                    y={direction === 'vertical' ? boxStart : center - bandWidth/2}
                                    width={direction === 'vertical' ? bandWidth : boxSize}
                                    height={direction === 'vertical' ? boxSize : bandWidth}
                                    fill={getColor(resolvedColors, i)}
                                    stroke="black"
                                />

                                {/* Median Line */}
                                <line 
                                    x1={direction === 'vertical' ? center - bandWidth/2 : medianPos} 
                                    y1={direction === 'vertical' ? medianPos : center - bandWidth/2} 
                                    x2={direction === 'vertical' ? center + bandWidth/2 : medianPos} 
                                    y2={direction === 'vertical' ? medianPos : center + bandWidth/2} 
                                    stroke="black" 
                                    strokeWidth={2}
                                />

                                {/* Outliers */}
                                {d.outliers.map((outlier, oi) => {
                                    const outPos = direction === 'vertical' ? yScale(outlier) : xScale(outlier);
                                    const r = 4; // radius of rhombus
                                    // Rhombus points: (cx, cy-r), (cx+r, cy), (cx, cy+r), (cx-r, cy)
                                    const cx = direction === 'vertical' ? center : outPos;
                                    const cy = direction === 'vertical' ? outPos : center;
                                    const points = `${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}`;
                                    
                                    return (
                                        <polygon 
                                            key={`outlier-${oi}`} 
                                            points={points} 
                                            fill="none" 
                                            stroke="red" 
                                            strokeWidth={1} 
                                        />
                                    );
                                })}
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Tooltip */}
            {hoveredItem && tooltipPos && (
                <div style={{
                    position: 'fixed',
                    left: tooltipPos.x + 10,
                    top: tooltipPos.y + 10,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    padding: '5px',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 1000,
                    fontSize: '12px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    <strong>{hoveredItem.category}</strong><br/>
                    Max: {hoveredItem.max.toFixed(2)}<br/>
                    Q3: {hoveredItem.q3.toFixed(2)}<br/>
                    Median: {hoveredItem.median.toFixed(2)}<br/>
                    Q1: {hoveredItem.q1.toFixed(2)}<br/>
                    Min: {hoveredItem.min.toFixed(2)}<br/>
                    {hoveredItem.mean !== undefined && <>Mean: {hoveredItem.mean.toFixed(2)}<br/></>}
                    {hoveredItem.outliers.length > 0 && <>Outliers: {hoveredItem.outliers.length}</>}
                </div>
            )}
        </div>
    );
};
