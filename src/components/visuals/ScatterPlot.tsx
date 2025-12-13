import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleLinear, scaleOrdinal, max, min, schemeTableau10, axisBottom, axisLeft, select } from "d3";
import type { ReportVisual, Dataset } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { findColumnIndex } from "../../lib/dataset-utility";

export interface ScatterPlotProps extends ReportVisual {
    xColumn?: string | number;
    yColumn?: string | number;
    categoryColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: string[];
    showLegend?: boolean;
    legendTitle?: string;
    pointSize?: number;
    showTrendline?: boolean;
    showCorrelation?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

export const ScatterPlot: React.FC<ScatterPlotProps> = ({
    xColumn = 0,
    yColumn = 1,
    categoryColumn,
    datasetId,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    width = 600,
    height = 400,
    minX,
    maxX,
    minY,
    maxY,
    xAxisLabel,
    yAxisLabel,
    chartMargin,
    colors,
    showLegend = true,
    legendTitle,
    pointSize = 5,
    showTrendline = false,
    showCorrelation = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, category: string } | null>(null);

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

    const processedData = useMemo(() => {
        if (!dataset) return { data: [], categories: [] };

        const xIdx = findColumnIndex(xColumn, dataset);
        const yIdx = findColumnIndex(yColumn, dataset);
        const catIdx = categoryColumn !== undefined ? findColumnIndex(categoryColumn, dataset) : undefined;

        if (xIdx === undefined || yIdx === undefined) return { data: [], categories: [] };

        const data = dataset.data.map(row => {
            const xVal = Number(Array.isArray(row) ? row[xIdx] : row[dataset.columns[xIdx]]);
            const yVal = Number(Array.isArray(row) ? row[yIdx] : row[dataset.columns[yIdx]]);
            const category = catIdx !== undefined 
                ? String(Array.isArray(row) ? row[catIdx] : row[dataset.columns[catIdx]]) 
                : 'Default';
            
            return { x: xVal, y: yVal, category };
        }).filter(d => !isNaN(d.x) && !isNaN(d.y));

        const categories = Array.from(new Set(data.map(d => d.category)));
        return { data, categories };
    }, [dataset, xColumn, yColumn, categoryColumn]);

    const stats = useMemo(() => {
        if (!processedData.data.length) return { slope: 0, intercept: 0, r: 0, rSquared: 0 };

        const n = processedData.data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        processedData.data.forEach(d => {
            sumX += d.x;
            sumY += d.y;
            sumXY += d.x * d.y;
            sumX2 += d.x * d.x;
            sumY2 += d.y * d.y;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const r = denominator === 0 ? 0 : numerator / denominator;

        return { slope, intercept, r, rSquared: r * r };
    }, [processedData.data]);

    const innerWidth = chartWidth - resolvedMargin.left - resolvedMargin.right;
    const innerHeight = height - resolvedMargin.top - resolvedMargin.bottom;

    const xScale = useMemo(() => {
        const xValues = processedData.data.map(d => d.x);
        const xMin = minX ?? min(xValues) ?? 0;
        const xMax = maxX ?? max(xValues) ?? 100;
        // Add some padding to the domain
        const xPadding = (xMax - xMin) * 0.05;
        return scaleLinear()
            .domain([xMin - xPadding, xMax + xPadding])
            .range([0, innerWidth]);
    }, [processedData.data, minX, maxX, innerWidth]);

    const yScale = useMemo(() => {
        const yValues = processedData.data.map(d => d.y);
        const yMin = minY ?? min(yValues) ?? 0;
        const yMax = maxY ?? max(yValues) ?? 100;
        // Add some padding to the domain
        const yPadding = (yMax - yMin) * 0.05;
        return scaleLinear()
            .domain([yMin - yPadding, yMax + yPadding])
            .range([innerHeight, 0]);
    }, [processedData.data, minY, maxY, innerHeight]);

    const colorScale = useMemo(() => {
        return scaleOrdinal(colors || schemeTableau10)
            .domain(processedData.categories);
    }, [processedData.categories, colors]);

    // Generate trendline points
    const trendlinePoints = useMemo(() => {
        if (!showTrendline || processedData.data.length < 2) return null;
        const xDomain = xScale.domain();
        const x1 = xDomain[0];
        const x2 = xDomain[1];
        const y1 = stats.slope * x1 + stats.intercept;
        const y2 = stats.slope * x2 + stats.intercept;
        return { x1, y1, x2, y2 };
    }, [showTrendline, stats, xScale]);

    return (
        <div 
            ref={containerRef}
            className="dl2-visual-container"
            style={{
                padding: padding || 10,
                margin: margin || 10,
                border: border ? '1px solid #ccc' : undefined,
                boxShadow: shadow ? '2px 2px 5px rgba(0, 0, 0, 0.1)' : undefined,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'white',
                overflow: 'hidden'
            }}
        >
            {title && <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>{title}</h3>}
            
            <div style={{ position: 'relative', width: '100%', height: height }}>
                <svg width={chartWidth} height={height}>
                    <g transform={`translate(${resolvedMargin.left},${resolvedMargin.top})`}>
                        {/* Grid lines */}
                        <g className="grid-lines">
                            {yScale.ticks(5).map(tick => (
                                <line
                                    key={tick}
                                    x1={0}
                                    x2={innerWidth}
                                    y1={yScale(tick)}
                                    y2={yScale(tick)}
                                    stroke="#e0e0e0"
                                    strokeDasharray="3,3"
                                />
                            ))}
                            {xScale.ticks(5).map(tick => (
                                <line
                                    key={tick}
                                    x1={xScale(tick)}
                                    x2={xScale(tick)}
                                    y1={0}
                                    y2={innerHeight}
                                    stroke="#e0e0e0"
                                    strokeDasharray="3,3"
                                />
                            ))}
                        </g>

                        {/* Axes */}
                        <g transform={`translate(0,${innerHeight})`}>
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="black" />
                            {xScale.ticks(10).map(tick => (
                                <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                                    <line y2={6} stroke="black" />
                                    <text y={20} textAnchor="middle" fontSize="10">{tick}</text>
                                </g>
                            ))}
                            {xAxisLabel && (
                                <text
                                    x={innerWidth / 2}
                                    y={40}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    {xAxisLabel}
                                </text>
                            )}
                        </g>

                        <g>
                            <line y1={0} y2={innerHeight} stroke="black" />
                            {yScale.ticks(5).map(tick => (
                                <g key={tick} transform={`translate(0,${yScale(tick)})`}>
                                    <line x2={-6} stroke="black" />
                                    <text x={-10} dy=".32em" textAnchor="end" fontSize="10">{tick}</text>
                                </g>
                            ))}
                            {yAxisLabel && (
                                <text
                                    transform="rotate(-90)"
                                    x={-innerHeight / 2}
                                    y={-35}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    {yAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Trendline */}
                        {trendlinePoints && (
                            <line
                                x1={xScale(trendlinePoints.x1)}
                                y1={yScale(trendlinePoints.y1)}
                                x2={xScale(trendlinePoints.x2)}
                                y2={yScale(trendlinePoints.y2)}
                                stroke="red"
                                strokeWidth={2}
                                strokeDasharray="5,5"
                                opacity={0.7}
                            />
                        )}

                        {/* Data Points */}
                        {processedData.data.map((d, i) => (
                            <circle
                                key={i}
                                cx={xScale(d.x)}
                                cy={yScale(d.y)}
                                r={pointSize}
                                fill={colorScale(d.category)}
                                stroke="white"
                                strokeWidth={1}
                                opacity={0.8}
                                onMouseEnter={() => setHoveredData(d)}
                                onMouseLeave={() => setHoveredData(null)}
                            >
                                <title>{`X: ${d.x}\nY: ${d.y}\nCategory: ${d.category}`}</title>
                            </circle>
                        ))}
                    </g>
                </svg>

                {/* Tooltip */}
                {hoveredData && (
                    <div style={{
                        position: 'absolute',
                        left: resolvedMargin.left + xScale(hoveredData.x) + 10,
                        top: resolvedMargin.top + yScale(hoveredData.y) - 10,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}>
                        <div><strong>{hoveredData.category}</strong></div>
                        <div>X: {hoveredData.x}</div>
                        <div>Y: {hoveredData.y}</div>
                    </div>
                )}

                {/* Correlation Info */}
                {showCorrelation && (
                    <div style={{
                        position: 'absolute',
                        top: resolvedMargin.top + 10,
                        right: resolvedMargin.right + 10,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '5px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '11px'
                    }}>
                        <div><strong>Correlation</strong></div>
                        <div>r: {stats.r.toFixed(3)}</div>
                        <div>r²: {stats.rSquared.toFixed(3)}</div>
                        <div>y = {stats.slope.toFixed(2)}x + {stats.intercept.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {showLegend && processedData.categories.length > 0 && categoryColumn !== undefined && (
                <VisualLegend 
                    items={processedData.categories.map(cat => ({
                        key: cat,
                        label: cat,
                        fill: colorScale(cat)
                    }))}
                    title={legendTitle}
                />
            )}
            
            {description && (
                <div style={{ padding: '10px', fontSize: '0.9em', color: '#666' }}>
                    {description}
                </div>
            )}
        </div>
    );
};
