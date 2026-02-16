import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleBand, scaleLinear, scaleOrdinal, max, schemeTableau10 } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty, ThresholdConfig } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";
import { FloatingTooltip } from "./Tooltip";

/**
 * Props for the ClusteredBarChart component.
 */
export interface ClusteredBarChartProps extends ReportVisual {
    /** Additional visual elements like markers or trend lines. */
    otherElements?: ReportVisualElement[];
    /** Column to use for the X-axis (categories). */
    xColumn?: string | number;
    /** Column(s) to use for the Y-axis (values). Multiple columns create clusters. */
    yColumns?: string | string[];
    
    title?: string;
    width?: number;
    height?: number;
    /** Minimum value for the Y-axis. Defaults to 0. */
    minY?: number;
    /** Maximum value for the Y-axis. If not provided, calculated from data. */
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the bars. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    /** Optional title for the legend. */
    legendTitle?: string;
    /** Whether to show value labels inside the bars. Defaults to false. */
    showLabels?: boolean;
    /** 
     * Optional threshold configuration for pass/fail coloring.
     * When provided, bars will be colored based on whether values pass or fail the threshold.
     */
    threshold?: ThresholdConfig;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

/**
 * ClusteredBarChart Component
 * Renders a bar chart where multiple series are grouped (clustered) for each category.
 */
export const ClusteredBarChart: React.FC<ClusteredBarChartProps> = ({
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
    showLabels = false,
    threshold
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredData, setHoveredData] = useState<{ x: number, y: number, label: string, value: number, series: string } | null>(null);

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

    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    // Process dataset into a format suitable for D3
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
            // Use UTC for printing dates on categories to avoid off-by-one errors due to timezone
            const item: any = { x: isDate(xVal) ? printDate(xVal, undefined, true) : String(xVal) };
            yIndices.forEach((yIdx, i) => {
                item[keys[i]] = Number(getValue(row, yIdx));
            });
            return item;
        });

        return { data, keys };
    }, [dataset, xColumn, yColumns]);

    const { data, keys } = processedData;

    // Threshold configuration with defaults
    const thresholdConfig = useMemo(() => {
        if (!threshold) return null;
        return {
            value: threshold.value,
            passColor: threshold.passColor || '#22c55e', // green-500
            failColor: threshold.failColor || '#ef4444', // red-500
            mode: threshold.mode || 'above',
            showLine: threshold.showLine !== false,
            lineStyle: threshold.lineStyle || 'dashed',
            applyTo: threshold.applyTo || 'both'
        };
    }, [threshold]);

    /** Determine if a value passes the threshold check */
    const passesThreshold = (value: number): boolean => {
        if (!thresholdConfig) return true;
        switch (thresholdConfig.mode) {
            case 'above': return value >= thresholdConfig.value;
            case 'below': return value <= thresholdConfig.value;
            case 'equals': return value === thresholdConfig.value;
            default: return value >= thresholdConfig.value;
        }
    };

    /** Get color for a specific value based on threshold */
    const getThresholdColor = (value: number): string | null => {
        if (!thresholdConfig) return null;
        return passesThreshold(value) ? thresholdConfig.passColor : thresholdConfig.failColor;
    };

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    // Define color scale for the series
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

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);

    // Scale for the groups (categories) along the X-axis
    const x0Scale = useMemo(() => {
        return scaleBand()
            .domain(data.map(d => d.x))
            .range([0, innerWidth])
            .padding(0.2);
    }, [data, innerWidth]);

    // Scale for the individual bars within each group
    const x1Scale = useMemo(() => {
        return scaleBand()
            .domain(keys)
            .range([0, x0Scale.bandwidth()])
            .padding(0.05);
    }, [keys, x0Scale]);

    // Linear scale for the Y-axis (values)
    const yScale = useMemo(() => {
        const maxVal = max(data, d => max(keys, key => d[key])) || 0;
        const computedMaxY = maxY !== undefined ? maxY : maxVal;
        const computedMinY = minY !== undefined ? minY : 0;

        return scaleLinear()
            .domain([computedMinY, computedMaxY])
            .range([innerHeight, 0]);
    }, [data, keys, maxY, minY, innerHeight]);

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

    // Prepare items for the legend
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
            <div className="dl2-clustered-bar-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }

    return (
        <div className="dl2-clustered-bar-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Clustered Bar Chart"}
                    style={{ display: "block", maxWidth: "100%" }}
                >
                    <g transform={`translate(${resolvedMargin.left}, ${resolvedMargin.top})`}>
                        {/* Horizontal Grid lines */}
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

                        {/* Threshold reference line */}
                        {thresholdConfig && thresholdConfig.showLine && (
                            <line
                                x1={0}
                                x2={innerWidth}
                                y1={yScale(thresholdConfig.value)}
                                y2={yScale(thresholdConfig.value)}
                                stroke="var(--dl2-text-muted)"
                                strokeWidth={1.5}
                                strokeDasharray={
                                    thresholdConfig.lineStyle === 'dashed' ? '8 4' :
                                    thresholdConfig.lineStyle === 'dotted' ? '2 2' : 'none'
                                }
                                opacity={0.7}
                            />
                        )}

                        {/* Render Bar Groups */}
                        {data.map((d, i) => {
                            const groupX = x0Scale(d.x);
                            if (groupX === undefined) return null;

                            return (
                                <g key={i} transform={`translate(${groupX}, 0)`}>
                                    {keys.map((key) => {
                                        const barX = x1Scale(key);
                                        const barWidth = x1Scale.bandwidth();
                                        const value = d[key];
                                        const barY = yScale(value);
                                        const barHeight = innerHeight - barY;
                                        const isHovered = hoveredData?.label === d.x && hoveredData?.series === key;
                                        
                                        // Determine bar color: use threshold color if configured, otherwise use series color
                                        const baseColor = colorScale(key);
                                        const barColor = thresholdConfig ? (getThresholdColor(value) || baseColor) : baseColor;

                                        if (barX === undefined) return null;

                                        return (
                                            <g key={key}>
                                                <rect
                                                    x={barX}
                                                    y={barY}
                                                    width={barWidth}
                                                    height={barHeight}
                                                    fill={barColor}
                                                    fillOpacity={isHovered ? 0.8 : 1}
                                                    stroke={isHovered ? "var(--dl2-text-main)" : "none"}
                                                    strokeWidth={1}
                                                    onMouseEnter={(e) => {
                                                        const rect = containerRef.current?.getBoundingClientRect();
                                                        if (rect) {
                                                            setHoveredData({
                                                                x: e.clientX,
                                                                y: e.clientY,
                                                                label: d.x,
                                                                value: value,
                                                                series: key
                                                            });
                                                        }
                                                    }}
                                                    onMouseMove={(e) => {
                                                        const rect = containerRef.current?.getBoundingClientRect();
                                                        if (rect) {
                                                            setHoveredData({
                                                                x: e.clientX,
                                                                y: e.clientY,
                                                                label: d.x,
                                                                value: value,
                                                                series: key
                                                            });
                                                        }
                                                    }}
                                                    onMouseLeave={() => setHoveredData(null)}
                                                    style={{ 
                                                        transition: "all 0.2s",
                                                        cursor: "pointer",
                                                        transform: isHovered ? "translateY(-2px)" : "translateY(0)"
                                                    }}
                                                />
                                                {/* Optional value labels inside bars */}
                                                {showLabels && barHeight > 15 && (
                                                    <text
                                                        x={barX + barWidth / 2}
                                                        y={barY + barHeight / 2}
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
                            );
                        })}

                        {/* X Axis Rendering */}
                        <g transform={`translate(0, ${innerHeight})`}>
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="var(--dl2-text-main)" />
                            {x0Scale.domain().map((d, i) => {
                                // Skip labels if they would overlap
                                const skip = Math.ceil(x0Scale.domain().length / 10);
                                if (i % skip !== 0) return null;
                                
                                const x = x0Scale(d);
                                if (x === undefined) return null;
                                
                                return (
                                    <g key={d} transform={`translate(${x + x0Scale.bandwidth() / 2}, 0)`}>
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

                        {/* Layer for additional visual elements (markers, trends, etc.) */}
                        <ReportVisualElementsLayer
                            elements={otherElements}
                            innerWidth={innerWidth}
                            innerHeight={innerHeight}
                            xScale={x0Scale as any}
                            yScale={yScale as any}
                            defaultValueAxis="y"
                        />
                    </g>
                </svg>

                {/* Floating Tooltip */}
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

            {/* Legend Rendering */}
            {showLegend && legendItems.length > 0 && (
                <VisualLegend
                    title={legendTitle}
                    items={legendItems}
                />
            )}
        </div>
    );
};

