import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scalePoint, scaleLinear, scaleOrdinal, max, schemeTableau10, line, curveLinear, curveMonotoneX } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";

/**
 * Props for the LineChart component.
 */
export interface LineChartProps extends ReportVisual {
    /** Additional visual elements like markers or trend lines. */
    otherElements?: ReportVisualElement[];
    /** Column for the X-axis (categories or time). */
    xColumn?: string | number;
    /** Column(s) for the Y-axis (numerical values). */
    yColumns?: string | string[];
    title?: string;
    width?: number;
    height?: number;
    /** Fixed minimum value for the Y-axis. */
    minY?: number;
    /** Fixed maximum value for the Y-axis. */
    maxY?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    /** Color or color palette for the lines. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    legendTitle?: string;
    /** Whether to show value labels above points. Defaults to false. */
    showLabels?: boolean;
    /** Whether to use monotone cubic interpolation for smooth lines. Defaults to false. */
    smooth?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

/**
 * LineChart Component
 * Renders a multi-series line chart with optional smoothing and interactive points.
 */
export const LineChart: React.FC<LineChartProps> = ({
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
    smooth = false
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

    // Process dataset into a format suitable for multi-series line rendering
    const processedData = useMemo(() => {
        if (!dataset) return { data: [], keys: [] };

        const xIdx = findColumnIndex(xColumn, dataset);
        const yCols = Array.isArray(yColumns) ? yColumns : [yColumns];
        const yIndices = yCols.map(col => findColumnIndex(col, dataset)).filter(idx => idx !== undefined) as number[];
        const keys = yIndices.map(idx => dataset.columns[idx]);

        const data = dataset.data.map(row => {
            const xVal = row[xIdx ?? 0];
            const item: any = { x: isDate(xVal) ? printDate(xVal) : String(xVal) };
            yIndices.forEach((yIdx, i) => {
                item[keys[i]] = Number(row[yIdx]);
            });
            return item;
        });

        return { data, keys };
    }, [dataset, xColumn, yColumns]);

    const { data, keys } = processedData;

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    // Ordinal scale for series colors
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

    // Point scale for the X-axis (categorical/time labels)
    const xScale = useMemo(() => {
        return scalePoint()
            .domain(data.map(d => d.x))
            .range([0, innerWidth])
            .padding(0.5);
    }, [data, innerWidth]);

    // Linear scale for the Y-axis (numerical values)
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

    // D3 Line generator with optional smoothing
    const lineGenerator = useMemo(() => {
        return line<any>()
            .x(d => xScale(d.x) ?? 0)
            .y(d => yScale(d.value))
            .curve(smooth ? curveMonotoneX : curveLinear);
    }, [xScale, yScale, smooth]);

    if (!dataset || data.length === 0) {
        return (
            <div className="dl2-line-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }

    return (
        <div className="dl2-line-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Line Chart"}
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

                        {/* Render Lines and Points for each series */}
                        {keys.map((key) => {
                            const seriesData = data.map(d => ({ x: d.x, value: d[key] }));
                            const pathD = lineGenerator(seriesData);
                            const color = colorScale(key);

                            return (
                                <g key={key}>
                                    {/* Series Line */}
                                    <path
                                        d={pathD || ""}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth={2}
                                    />
                                    
                                    {/* Interactive Points */}
                                    {seriesData.map((d, i) => {
                                        const cx = xScale(d.x);
                                        const cy = yScale(d.value);
                                        
                                        if (cx === undefined) return null;

                                        return (
                                            <g key={i}>
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={hoveredData?.label === d.x && hoveredData?.series === key ? 7 : 4}
                                                    fill={color}
                                                    stroke="var(--dl2-bg-visual)"
                                                    strokeWidth={1}
                                                    onMouseEnter={(e) => {
                                                        const rect = containerRef.current?.getBoundingClientRect();
                                                        if (rect) {
                                                            setHoveredData({
                                                                x: e.clientX - rect.left,
                                                                y: e.clientY - rect.top,
                                                                label: d.x,
                                                                value: d.value,
                                                                series: key
                                                            });
                                                        }
                                                    }}
                                                    onMouseMove={(e) => {
                                                        const rect = containerRef.current?.getBoundingClientRect();
                                                        if (rect) {
                                                            setHoveredData({
                                                                x: e.clientX - rect.left,
                                                                y: e.clientY - rect.top,
                                                                label: d.x,
                                                                value: d.value,
                                                                series: key
                                                            });
                                                        }
                                                    }}
                                                    onMouseLeave={() => setHoveredData(null)}
                                                    style={{ transition: "r 0.2s", cursor: "pointer" }}
                                                />
                                                {/* Optional value labels above points */}
                                                {showLabels && (
                                                    <text
                                                        x={cx}
                                                        y={cy - 10}
                                                        textAnchor="middle"
                                                        fill="var(--dl2-text-main)"
                                                        fontSize="10px"
                                                        style={{ pointerEvents: "none", textShadow: "0px 0px 2px var(--dl2-bg-visual)" }}
                                                    >
                                                        {d.value.toLocaleString()}
                                                    </text>
                                                )}
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        })}

                        {/* X Axis rendering */}
                        <g transform={`translate(0, ${innerHeight})`}>
                            <line x1={0} x2={innerWidth} y1={0} y2={0} stroke="var(--dl2-text-main)" />
                            {xScale.domain().map((d, i) => {
                                // Simple logic to skip labels if too many
                                const skip = Math.ceil(xScale.domain().length / 10);
                                if (i % skip !== 0) return null;
                                
                                const x = xScale(d);
                                if (x === undefined) return null;
                                
                                return (
                                    <g key={d} transform={`translate(${x}, 0)`}>
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

                        {/* Y Axis rendering */}
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
                            xScale={xScale as any}
                            yScale={yScale as any}
                            defaultValueAxis="y"
                        />
                    </g>
                </svg>

                {/* Floating Tooltip */}
                {hoveredData && (
                    <div style={{
                        position: "absolute",
                        left: hoveredData.x,
                        top: hoveredData.y,
                        transform: "translate(-50%, -100%)",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        padding: "8px",
                        borderRadius: "4px",
                        pointerEvents: "none",
                        fontSize: "12px",
                        zIndex: 10,
                        marginTop: "-10px",
                        whiteSpace: "nowrap"
                    }}>
                        <div style={{ fontWeight: "bold" }}>{hoveredData.label}</div>
                        <div>{hoveredData.series}: {hoveredData.value.toLocaleString()}</div>
                    </div>
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
