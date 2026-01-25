import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleLinear, max, bin, min } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty } from "../../lib/types";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors, getColor } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";

/**
 * Props for the Histogram component.
 */
export interface HistogramProps extends ReportVisual {
    /** Column to bin for the histogram. */
    column?: string | number;
    /** Number of bins to generate. Defaults to 10. */
    bins?: number;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the bars. */
    color?: ColorProperty;
    /** Whether to show frequency labels above bars. */
    showLabels?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

/**
 * Histogram Component
 * Visualizes the distribution of a numerical dataset by grouping values into bins.
 */
export const Histogram: React.FC<HistogramProps> = ({
    column = 0,
    bins = 10,
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
    xAxisLabel,
    yAxisLabel,
    chartMargin,
    color = "#69b3a2",
    showLabels = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredBin, setHoveredBin] = useState<{ x0: number | undefined, x1: number | undefined, length: number } | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null);

    // Handle responsive resizing
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

    /** Helper to find column index by name or index. */
    const findColumnIndex = (col: string | number, dataset: Dataset): number | undefined => {
        if (!dataset) return undefined;
        if ((typeof col === "number") && (col >= 0) && (col < dataset.columns.length)) {
            return col;
        } else if (typeof col === "string") {
            const colIndex = dataset.columns.indexOf(col);
            return colIndex >= 0 ? colIndex : 0;
        }
        return undefined;
    };

    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    const resolvedColors = useMemo(() => resolveColors(color), [color]);

    // Process dataset into bins using D3's bin generator
    const processedData = useMemo(() => {
        if (!dataset) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const colIdx = findColumnIndex(column, dataset);
        if (colIdx === undefined) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const colName = dataset.columns[colIdx];

        // Extract and normalize numerical data
        const data = dataset.data.map(row => {
            let val;
            if (dataset.format === 'records' || !Array.isArray(row)) {
                val = row[colName];
            } else {
                val = row[colIdx];
            }
            
            if (isDate(val)) return val.getTime();
            return typeof val === 'number' ? val : parseFloat(val);
        }).filter(val => !isNaN(val));

        if (data.length === 0) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const minValue = min(data) ?? 0;
        const maxValue = max(data) ?? 1;
        
        // Configure D3 histogram generator
        const histogramGenerator = bin()
            .domain([minValue, maxValue])
            .thresholds(bins);

        const binsData = histogramGenerator(data);
        const yMax = max(binsData, d => d.length) ?? 0;

        return { binsData, xDomain: [minValue, maxValue], yMax };
    }, [dataset, column, bins]);

    const { binsData, xDomain, yMax } = processedData;

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);

    // Linear scales for X (value range) and Y (frequency)
    const xScale = useMemo(() => {
        return scaleLinear()
            .domain(xDomain)
            .range([0, innerWidth]);
    }, [xDomain, innerWidth]);

    const yScale = useMemo(() => {
        return scaleLinear()
            .domain([0, yMax])
            .range([innerHeight, 0]);
    }, [yMax, innerHeight]);

    if (!dataset) {
        return (
            <div className="dl2-histogram dl2-visual-container" style={{ padding: padding || 10, margin: margin || 10, border: border ? '1px solid var(--dl2-border-main)' : undefined }}>
                <div className="dl2-chart-empty">Dataset not found: {datasetId}</div>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef}
            className="dl2-histogram dl2-visual-container"
            style={{ 
                padding: padding || 10, 
                margin: margin || 10, 
                border: border ? '1px solid var(--dl2-border-main)' : undefined, 
                boxShadow: shadow ? '2px 2px 5px var(--dl2-shadow)' : undefined,
                width: '100%',
                flex: flex || 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }}
        >
            {title && <h3 className="dl2-chart-title" style={{ textAlign: 'center' }}>{title}</h3>}
            {description && <p className="dl2-chart-description" style={{ textAlign: 'center' }}>{description}</p>}
            
            <div className="relative" style={{ height: height }}>
                <svg className="dl2-chart-svg" width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
                    <g transform={`translate(${resolvedMargin.left},${resolvedMargin.top})`}>
                        {/* Horizontal Grid lines */}
                        {yScale.ticks(5).map(tickValue => (
                            <line
                                key={tickValue}
                                x1={0}
                                x2={innerWidth}
                                y1={yScale(tickValue)}
                                y2={yScale(tickValue)}
                                stroke="var(--dl2-border-table)"
                                strokeDasharray="4 4"
                            />
                        ))}

                        {/* Render Histogram Bars */}
                        {binsData.map((d, i) => {
                            const x0 = d.x0 ?? 0;
                            const x1 = d.x1 ?? 0;
                            const barX = xScale(x0);
                            const barWidth = Math.max(0, xScale(x1) - xScale(x0) - 1);
                            const barHeight = innerHeight - yScale(d.length);
                            
                            return (
                                <rect
                                    key={i}
                                    x={barX}
                                    y={yScale(d.length)}
                                    width={barWidth}
                                    height={innerHeight - yScale(d.length)}
                                    fill={getColor(resolvedColors, i)}
                                    opacity={hoveredBin === d ? 0.8 : 1}
                                    stroke={hoveredBin === d ? "var(--dl2-text-main)" : "none"}
                                    strokeWidth={1}
                                    style={{ 
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        transform: hoveredBin === d ? 'translateY(-2px)' : 'translateY(0)'
                                    }}
                                    onMouseEnter={(e) => {
                                        setHoveredBin(d);
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltipPos({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top
                                            });
                                        }
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltipPos({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredBin(null);
                                        setTooltipPos(null);
                                    }}
                                />
                            );
                        })}

                        {/* X Axis rendering */}
                        <g transform={`translate(0,${innerHeight})`} color="var(--dl2-text-main)">
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="currentColor" />
                            {xScale.ticks(bins).map(tickValue => (
                                <g key={tickValue} transform={`translate(${xScale(tickValue)},0)`}>
                                    <line y2={6} stroke="currentColor" />
                                    <text y={20} textAnchor="middle" fontSize={10} fill="currentColor">
                                        {tickValue}
                                    </text>
                                </g>
                            ))}
                            {xAxisLabel && (
                                <text
                                    x={innerWidth / 2}
                                    y={40}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize={12}
                                    fontWeight="bold"
                                >
                                    {xAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Y Axis rendering */}
                        <g color="var(--dl2-text-main)">
                            <line y1={0} y2={innerHeight} stroke="currentColor" />
                            {yScale.ticks(5).map(tickValue => (
                                <g key={tickValue} transform={`translate(0,${yScale(tickValue)})`}>
                                    <line x2={-6} stroke="currentColor" />
                                    <text x={-10} dy={4} textAnchor="end" fontSize={10} fill="currentColor">
                                        {tickValue}
                                    </text>
                                </g>
                            ))}
                            {yAxisLabel && (
                                <text
                                    transform="rotate(-90)"
                                    x={-innerHeight / 2}
                                    y={-35}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    fontSize={12}
                                    fontWeight="bold"
                                >
                                    {yAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Optional frequency labels above bars */}
                        {showLabels && binsData.map((d, i) => {
                            const x0 = d.x0 ?? 0;
                            const x1 = d.x1 ?? 0;
                            const barX = xScale(x0);
                            const barWidth = Math.max(0, xScale(x1) - xScale(x0) - 1);
                            
                            if (d.length === 0) return null;

                            return (
                                <text
                                    key={`label-${i}`}
                                    x={barX + barWidth / 2}
                                    y={yScale(d.length) - 5}
                                    textAnchor="middle"
                                    fontSize={10}
                                    fill="var(--dl2-text-main)"
                                >
                                    {d.length}
                                </text>
                            );
                        })}
                        
                        {/* Layer for additional visual elements (markers, trends, etc.) */}
                        {otherElements && (
                            <ReportVisualElementsLayer
                                elements={otherElements}
                                xScale={xScale}
                                yScale={yScale}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                            />
                        )}
                    </g>
                </svg>
            </div>

            {/* Floating Tooltip */}
            {hoveredBin && tooltipPos && (
                <div
                    style={{
                        position: "absolute",
                        left: tooltipPos.x + 15,
                        top: tooltipPos.y - 10,
                        transform: "translateY(-100%)",
                        backgroundColor: "var(--dl2-bg-main)",
                        color: "var(--dl2-text-main)",
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid var(--dl2-border-main)",
                        boxShadow: "0 2px 4px var(--dl2-shadow)",
                        pointerEvents: "none",
                        fontSize: "12px",
                        zIndex: 10,
                        whiteSpace: "nowrap"
                    }}
                >
                    <div style={{ fontWeight: "bold" }}>Range: {hoveredBin.x0} - {hoveredBin.x1}</div>
                    <div>Count: {hoveredBin.length}</div>
                </div>
            )}
        </div>
    );
};
