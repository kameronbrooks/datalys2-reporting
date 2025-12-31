import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleLinear, scaleOrdinal, max, min, schemeTableau10, axisBottom, axisLeft, select } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { findColumnIndex } from "../../lib/dataset-utility";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";

export interface ScatterPlotProps extends ReportVisual {
    otherElements?: ReportVisualElement[];
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
    colors?: ColorProperty;
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
    otherElements,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
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

    // Handle responsive resizing of the chart container
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

    // Resolve margins with defaults
    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    /**
     * Process raw dataset into structured scatter plot data.
     * Extracts X, Y, and optional Category values.
     */
    const processedData = useMemo(() => {
        if (!dataset) return { data: [], categories: [] };

        const xIdx = findColumnIndex(xColumn, dataset);
        const yIdx = findColumnIndex(yColumn, dataset);
        const catIdx = categoryColumn !== undefined ? findColumnIndex(categoryColumn, dataset) : undefined;

        if (xIdx === undefined || yIdx === undefined) return { data: [], categories: [] };

        const data = dataset.data.map(row => {
            const xRaw = Array.isArray(row) ? row[xIdx] : row[dataset.columns[xIdx]];
            const yRaw = Array.isArray(row) ? row[yIdx] : row[dataset.columns[yIdx]];
            const xVal = Number(xRaw);
            const yVal = Number(yRaw);
            
            const catRaw = catIdx !== undefined 
                ? (Array.isArray(row) ? row[catIdx] : row[dataset.columns[catIdx]])
                : 'Default';
            
            const category = isDate(catRaw) ? printDate(catRaw) : String(catRaw);
            
            return { x: xVal, y: yVal, category };
        }).filter(d => !isNaN(d.x) && !isNaN(d.y));

        const categories = Array.from(new Set(data.map(d => d.category)));
        return { data, categories };
    }, [dataset, xColumn, yColumn, categoryColumn]);

    /**
     * Calculate statistical metrics for the dataset.
     * Includes slope, intercept, and correlation coefficients.
     */
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

        // Linear regression formula
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Pearson correlation coefficient
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        const r = denominator === 0 ? 0 : numerator / denominator;

        return { slope, intercept, r, rSquared: r * r };
    }, [processedData.data]);

    const innerWidth = chartWidth - resolvedMargin.left - resolvedMargin.right;
    const innerHeight = height - resolvedMargin.top - resolvedMargin.bottom;

    // X-axis scale (Linear)
    const xScale = useMemo(() => {
        const xValues = processedData.data.map(d => d.x);
        const xMin = minX ?? min(xValues) ?? 0;
        const xMax = maxX ?? max(xValues) ?? 100;
        // Add 5% padding to the domain for better visual spacing
        const xPadding = (xMax - xMin) * 0.05;
        return scaleLinear()
            .domain([xMin - xPadding, xMax + xPadding])
            .range([0, innerWidth]);
    }, [processedData.data, minX, maxX, innerWidth]);

    // Y-axis scale (Linear)
    const yScale = useMemo(() => {
        const yValues = processedData.data.map(d => d.y);
        const yMin = minY ?? min(yValues) ?? 0;
        const yMax = maxY ?? max(yValues) ?? 100;
        // Add 5% padding to the domain for better visual spacing
        const yPadding = (yMax - yMin) * 0.05;
        return scaleLinear()
            .domain([yMin - yPadding, yMax + yPadding])
            .range([innerHeight, 0]);
    }, [processedData.data, minY, maxY, innerHeight]);

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    // Map categories to colors
    const colorScale = useMemo(() => {
        return scaleOrdinal(resolvedColors.length > 0 ? resolvedColors : schemeTableau10)
            .domain(processedData.categories);
    }, [processedData.categories, resolvedColors]);

    // Generate start and end points for the trendline based on regression stats
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
            className="dl2-scatter-plot dl2-visual-container"
            style={{
                padding: padding || 10,
                margin: margin || 10,
                border: border ? '1px solid var(--dl2-border-main)' : undefined,
                boxShadow: shadow ? '2px 2px 5px var(--dl2-shadow)' : undefined,
                flex: flex || 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}
        >
            {title && <h3 className="dl2-chart-title" style={{ textAlign: 'center' }}>{title}</h3>}
            {description && <p className="dl2-chart-description" style={{ textAlign: 'center' }}>{description}</p>}
            
            <div style={{ position: 'relative', width: '100%', height: height }}>
                <svg className="dl2-chart-svg" width={chartWidth} height={height}>
                    <g transform={`translate(${resolvedMargin.left},${resolvedMargin.top})`}>
                        {/* Background Grid lines */}
                        <g className="grid-lines">
                            {yScale.ticks(5).map(tick => (
                                <line
                                    key={tick}
                                    x1={0}
                                    x2={innerWidth}
                                    y1={yScale(tick)}
                                    y2={yScale(tick)}
                                    stroke="var(--dl2-border-table)"
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
                                    stroke="var(--dl2-border-table)"
                                    strokeDasharray="3,3"
                                />
                            ))}
                        </g>

                        {/* X-Axis Rendering */}
                        <g transform={`translate(0,${innerHeight})`}>
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="var(--dl2-text-main)" />
                            {xScale.ticks(10).map(tick => (
                                <g key={tick} transform={`translate(${xScale(tick)},0)`}>
                                    <line y2={6} stroke="var(--dl2-text-main)" />
                                    <text y={20} textAnchor="middle" fontSize="10" fill="var(--dl2-text-main)">{tick}</text>
                                </g>
                            ))}
                            {xAxisLabel && (
                                <text
                                    x={innerWidth / 2}
                                    y={40}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fontWeight="bold"
                                    fill="var(--dl2-text-main)"
                                >
                                    {xAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Y-Axis Rendering */}
                        <g>
                            <line y1={0} y2={innerHeight} stroke="var(--dl2-text-main)" />
                            {yScale.ticks(5).map(tick => (
                                <g key={tick} transform={`translate(0,${yScale(tick)})`}>
                                    <line x2={-6} stroke="var(--dl2-text-main)" />
                                    <text x={-10} dy=".32em" textAnchor="end" fontSize="10" fill="var(--dl2-text-main)">{tick}</text>
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
                                    fill="var(--dl2-text-main)"
                                >
                                    {yAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Regression Trendline */}
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

                        {/* Individual Data Points */}
                        {processedData.data.map((d, i) => (
                            <circle
                                key={i}
                                cx={xScale(d.x)}
                                cy={yScale(d.y)}
                                r={hoveredData === d ? pointSize + 3 : pointSize}
                                fill={colorScale(d.category)}
                                stroke="var(--dl2-bg-visual)"
                                strokeWidth={1}
                                opacity={0.8}
                                onMouseEnter={() => setHoveredData(d)}
                                onMouseLeave={() => setHoveredData(null)}
                                style={{ transition: 'r 0.2s', cursor: 'pointer' }}
                            >
                                <title>{`X: ${d.x}\nY: ${d.y}\nCategory: ${d.category}`}</title>
                            </circle>
                        ))}

                        {/* Overlay layer for additional visual elements (markers, trends, etc.) */}
                        <ReportVisualElementsLayer
                            elements={otherElements}
                            innerWidth={innerWidth}
                            innerHeight={innerHeight}
                            xScale={xScale as any}
                            yScale={yScale as any}
                            xDomain={xScale.domain() as [number, number]}
                            defaultValueAxis="y"
                        />
                    </g>
                </svg>

                {/* Interactive Tooltip */}
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

                {/* Statistical Correlation Information Overlay */}
                {showCorrelation && (
                    <div style={{
                        position: 'absolute',
                        top: resolvedMargin.top + 10,
                        right: resolvedMargin.right + 10,
                        backgroundColor: 'var(--dl2-bg-report)',
                        color: 'var(--dl2-text-main)',
                        padding: '5px',
                        border: '1px solid var(--dl2-border-main)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        opacity: 0.9
                    }}>
                        <div><strong>Correlation</strong></div>
                        <div>r: {stats.r.toFixed(3)}</div>
                        <div>r²: {stats.rSquared.toFixed(3)}</div>
                        <div>y = {stats.slope.toFixed(2)}x + {stats.intercept.toFixed(2)}</div>
                    </div>
                )}
            </div>

            {/* Legend for categories */}
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
                <div style={{ padding: '10px', fontSize: '0.9em', color: 'var(--dl2-text-secondary)' }}>
                    {description}
                </div>
            )}
        </div>
    );
};

