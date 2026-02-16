import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleBand, scaleLinear, scaleOrdinal, stack, max, schemeTableau10 } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";
import { FloatingTooltip } from "./Tooltip";

export interface StackedBarChartProps extends ReportVisual {
    otherElements?: ReportVisualElement[];
    xColumn?: string | number;
    yColumns?: string | string[];
    title?: string;
    width?: number;
    height?: number;
    minY?: number;
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: ColorProperty;
    showLegend?: boolean;
    legendTitle?: string;
    showLabels?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

export const StackedBarChart: React.FC<StackedBarChartProps> = ({
    xColumn = 0,
    yColumns = [1],
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
    minY,
    maxY,
    xAxisLabel,
    yAxisLabel,
    chartMargin,
    colors,
    showLegend = true,
    legendTitle,
    showLabels = false
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, label: string, value: number, series: string } | null>(null);

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

    /**
     * Helper to find the index of a column by name or index.
     */
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

    // Resolve margins with defaults
    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    /**
     * Process raw dataset into structured data for stacking.
     * Maps X-axis categories and multiple Y-axis series.
     */
    const processedData = useMemo(() => {
        if (!dataset) return { data: [], keys: [] };

        const xIdx = findColumnIndex(xColumn, dataset);
        const yCols = Array.isArray(yColumns) ? yColumns : [yColumns];
        const yIndices = yCols.map(col => findColumnIndex(col, dataset)).filter(idx => idx !== undefined) as number[];
        const keys = yIndices.map(idx => dataset.columns[idx]);

        // Helper to get value from row regardless of format
        const getValue = (row: any, colIdx: number | undefined) => {
            if (colIdx === undefined) return undefined;
            if (dataset.format === 'records' || dataset.format === 'record') {
                const colName = dataset.columns[colIdx];
                return row[colName];
            }
            return row[colIdx];
        };

        const data = dataset.data.map(row => {
            const xVal = getValue(row, xIdx ?? 0);
            const item: any = { x: isDate(xVal) ? printDate(xVal, undefined, true) : String(xVal) };
            yIndices.forEach((yIdx, i) => {
                item[keys[i]] = Number(getValue(row, yIdx));
            });
            return item;
        });

        return { data, keys };
    }, [dataset, xColumn, yColumns]);

    const { data, keys } = processedData;

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    // Map series keys to colors
    const colorScale = useMemo(() => {
        if (resolvedColors && resolvedColors.length > 0) {
            return scaleOrdinal<string, string>()
                .domain(keys)
                .range(resolvedColors);
        }
        return scaleOrdinal<string, string>()
            .domain(keys)
            .range(schemeTableau10);
    }, [keys, resolvedColors]);

    /**
     * Generate D3 stacked data structure.
     * Each layer represents a series, and each element in the layer represents a bar segment.
     */
    const stackedData = useMemo(() => {
        if (keys.length === 0) return [];
        return stack().keys(keys)(data);
    }, [data, keys]);

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);

    // X-axis scale (Band)
    const xScale = useMemo(() => {
        return scaleBand()
            .domain(data.map(d => d.x))
            .range([0, innerWidth])
            .padding(0.2);
    }, [data, innerWidth]);

    // Y-axis scale (Linear)
    const yScale = useMemo(() => {
        const maxStack = max(stackedData, layer => max(layer, d => d[1])) || 0;
        const computedMaxY = maxY !== undefined ? maxY : maxStack;
        const computedMinY = minY !== undefined ? minY : 0;

        return scaleLinear()
            .domain([computedMinY, computedMaxY])
            .range([innerHeight, 0]);
    }, [stackedData, maxY, minY, innerHeight]);

    const containerStyle: React.CSSProperties = {
        padding: padding || 10,
        margin: margin || 10,
        border: border ? "1px solid var(--dl2-border-main)" : undefined,
        boxShadow: shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        flex: flex || "1"
    };

    // Prepare items for the legend component
    const legendItems: VisualLegendItem[] = useMemo(() => {
        return keys.map((key, index) => {
            const total = data.reduce((acc, item) => acc + (item[key] || 0), 0);
            const grandTotal = data.reduce((acc, item) => {
                return acc + keys.reduce((kAcc, k) => kAcc + (item[k] || 0), 0);
            }, 0);
            
            return {
                key: key,
                label: key,
                value: total,
                percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
                fill: colorScale(key)
            };
        });
    }, [keys, data, colorScale]);

    if (!dataset || data.length === 0) {
        return (
            <div className="dl2-stacked-bar-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }

    return (
        <div className="dl2-stacked-bar-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Stacked Bar Chart"}
                    style={{ display: "block", maxWidth: "100%" }}
                >
                    <g transform={`translate(${resolvedMargin.left}, ${resolvedMargin.top})`}>
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
                                    strokeDasharray="3 3"
                                />
                            ))}
                        </g>

                        {/* Render Stacked Bars */}
                        {stackedData.map((layer) => (
                            <g key={layer.key} fill={colorScale(layer.key)}>
                                {layer.map((d, i) => {
                                    const x = xScale(String(d.data.x));
                                    const width = xScale.bandwidth();
                                    const y = yScale(d[1]);
                                    const height = yScale(d[0]) - yScale(d[1]);
                                    const value = d[1] - d[0];
                                    const isHovered = hoveredData?.label === String(d.data.x) && hoveredData?.series === layer.key;

                                    if (x === undefined) return null;

                                    return (
                                        <g key={i}>
                                            <rect
                                                x={x}
                                                y={y}
                                                width={width}
                                                height={height}
                                                fillOpacity={isHovered ? 0.8 : 1}
                                                stroke={isHovered ? "var(--dl2-text-main)" : "none"}
                                                strokeWidth={1}
                                                onMouseEnter={(e) => {
                                                    const rect = containerRef.current?.getBoundingClientRect();
                                                    if (rect) {
                                                        setHoveredData({
                                                            x: e.clientX,
                                                            y: e.clientY,
                                                            label: String(d.data.x),
                                                            value: value,
                                                            series: layer.key
                                                        });
                                                    }
                                                }}
                                                onMouseMove={(e) => {
                                                    const rect = containerRef.current?.getBoundingClientRect();
                                                    if (rect) {
                                                        setHoveredData({
                                                            x: e.clientX,
                                                            y: e.clientY,
                                                            label: String(d.data.x),
                                                            value: value,
                                                            series: layer.key
                                                        });
                                                    }
                                                }}
                                                onMouseLeave={() => setHoveredData(null)}
                                                style={{ 
                                                    transition: "all 0.2s",
                                                    cursor: "pointer",
                                                    filter: isHovered ? "brightness(1.1)" : "none"
                                                }}
                                            />
                                            {/* Optional value labels inside bars */}
                                            {showLabels && height > 15 && (
                                                <text
                                                    x={x + width / 2}
                                                    y={y + height / 2}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    fill="white"
                                                    fontSize="10px"
                                                    style={{ pointerEvents: "none", textShadow: "0px 0px 2px rgba(0,0,0,0.5)" }}
                                                >
                                                    {value.toLocaleString()}
                                                </text>
                                            )}
                                        </g>
                                    );
                                })}
                            </g>
                        ))}

                        {/* X Axis Rendering */}
                        <g transform={`translate(0, ${innerHeight})`}>
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="var(--dl2-text-main)" />
                            {xScale.domain().map((d, i) => {
                                // Simple logic to skip labels if too many to prevent overlap
                                const skip = Math.ceil(xScale.domain().length / 10);
                                if (i % skip !== 0) return null;
                                
                                const x = xScale(d);
                                if (x === undefined) return null;
                                
                                return (
                                    <g key={d} transform={`translate(${x + xScale.bandwidth() / 2}, 0)`}>
                                        <line y2={6} stroke="var(--dl2-text-main)" />
                                        <text
                                            y={20}
                                            textAnchor="middle"
                                            fontSize="10px"
                                            fill="var(--dl2-text-main)"
                                        >
                                            {d}
                                        </text>
                                    </g>
                                );
                            })}
                            {xAxisLabel && (
                                <text
                                    x={innerWidth / 2}
                                    y={40}
                                    textAnchor="middle"
                                    fontSize="12px"
                                    fontWeight="bold"
                                    fill="var(--dl2-text-main)"
                                >
                                    {xAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Y Axis Rendering */}
                        <g>
                            <line y1={0} y2={innerHeight} stroke="var(--dl2-text-main)" />
                            {yScale.ticks(5).map(tick => (
                                <g key={tick} transform={`translate(0, ${yScale(tick)})`}>
                                    <line x2={-6} stroke="var(--dl2-text-main)" />
                                    <text
                                        x={-10}
                                        dy="0.32em"
                                        textAnchor="end"
                                        fontSize="10px"
                                        fill="var(--dl2-text-main)"
                                    >
                                        {tick}
                                    </text>
                                </g>
                            ))}
                            {yAxisLabel && (
                                <text
                                    transform="rotate(-90)"
                                    x={-innerHeight / 2}
                                    y={-35}
                                    textAnchor="middle"
                                    fontSize="12px"
                                    fontWeight="bold"
                                    fill="var(--dl2-text-main)"
                                >
                                    {yAxisLabel}
                                </text>
                            )}
                        </g>

                        {/* Overlay layer for additional visual elements */}
                        <ReportVisualElementsLayer
                            elements={otherElements}
                            innerWidth={innerWidth}
                            innerHeight={innerHeight}
                            xScale={xScale as any}
                            yScale={yScale as any}
                            defaultValueAxis="y"
                        />
                    </g>
                </svg>

                {/* Interactive Tooltip */}
                {hoveredData && (
                    <FloatingTooltip
                        left={hoveredData.x}
                        top={hoveredData.y}
                        content={
                            <>
                                <div style={{ fontWeight: "bold" }}>{hoveredData.label}</div>
                                <div>{hoveredData.series}: {hoveredData.value.toLocaleString()}</div>
                            </>
                        }
                    />
                )}
            </div>

            {/* Optional Legend */}
            {showLegend && legendItems.length > 0 && (
                <VisualLegend
                    title={legendTitle}
                    items={legendItems}
                />
            )}
        </div>
    );
};
