import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { scaleBand, scaleLinear, min, max } from "d3";
import type { Dataset, ReportVisual, ColorProperty } from "../../lib/types";
import { findColumnIndex } from "../../lib/dataset-utility";
import { resolveInterpolator } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";

/**
 * Props for the Heatmap component.
 */
export interface HeatmapProps extends ReportVisual {
    /** Column for the X-axis categories. */
    xColumn?: string | number;
    /** Column for the Y-axis categories. */
    yColumn?: string | number;
    /** Column for the cell values (determines color intensity). */
    valueColumn?: string | number;

    title?: string;

    width?: number;
    height?: number;

    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;

    /** Optional fixed minimum value for the color scale. */
    minValue?: number;
    /** Optional fixed maximum value for the color scale. */
    maxValue?: number;

    /** Whether to show labels for X and Y axes. Defaults to true. */
    showAxisLabels?: boolean;
    xAxisLabel?: string;
    yAxisLabel?: string;

    /** Whether to show the value inside each cell. Defaults to false. */
    showCellLabels?: boolean;
    /** Optional formatter for cell labels. */
    cellLabelFormatter?: (value: number) => string;

    /** Text to show when no data is available. */
    emptyLabel?: string;
    /** Color or color interpolator for the heatmap. */
    color?: ColorProperty;
}

const defaultMargin = { top: 20, right: 20, bottom: 70, left: 90 };

/** Internal representation of a single heatmap cell. */
type HeatmapCell = {
    x: string;
    y: string;
    value: number;
};

/** Helper to extract cell value from a row based on column index. */
function getCellValue(row: any, dataset: Dataset, columnIndex: number): any {
    if (Array.isArray(row)) return row[columnIndex];
    const columnName = dataset.columns[columnIndex];
    return row?.[columnName];
}

/**
 * Heatmap Component
 * Renders a grid where cell colors represent values across two categorical dimensions.
 */
export const Heatmap: React.FC<HeatmapProps> = ({
    id,
    datasetId,
    xColumn = 0,
    yColumn = 1,
    valueColumn = 2,
    title,
    description,

    padding,
    margin,
    border,
    shadow,
    flex,

    width = 700,
    height = 420,
    chartMargin,

    minValue,
    maxValue,

    showAxisLabels = true,
    xAxisLabel,
    yAxisLabel,

    showCellLabels = false,
    cellLabelFormatter,

    emptyLabel = "No data available.",
    color
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredData, setHoveredData] = useState<{
        x: number;
        y: number;
        xLabel: string;
        yLabel: string;
        value: number;
    } | null>(null);

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

    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    // Resolve the color interpolator (e.g., d3.interpolateBlues)
    const interpolator = useMemo(() => resolveInterpolator(color), [color]);
    const gradientId = useMemo(() => `dl2-heatmap-gradient-${id.replace(/\s+/g, '-')}`, [id]);

    // Process dataset into cells and unique categories for axes
    const processed = useMemo(() => {
        if (!dataset) {
            return { cells: [] as HeatmapCell[], xCategories: [] as string[], yCategories: [] as string[] };
        }

        const xIdx = findColumnIndex(xColumn, dataset);
        const yIdx = findColumnIndex(yColumn, dataset);
        const vIdx = findColumnIndex(valueColumn, dataset);

        if (xIdx === undefined || yIdx === undefined || vIdx === undefined) {
            return { cells: [] as HeatmapCell[], xCategories: [] as string[], yCategories: [] as string[] };
        }

        const cells: HeatmapCell[] = [];
        const xCategories: string[] = [];
        const yCategories: string[] = [];
        const seenX = new Set<string>();
        const seenY = new Set<string>();

        for (const row of dataset.data) {
            const xRaw = getCellValue(row, dataset, xIdx);
            const yRaw = getCellValue(row, dataset, yIdx);
            const xVal = isDate(xRaw) ? printDate(xRaw) : String(xRaw);
            const yVal = isDate(yRaw) ? printDate(yRaw) : String(yRaw);
            const vRaw = getCellValue(row, dataset, vIdx);
            const vNum = Number(vRaw);
            if (!Number.isFinite(vNum)) continue;

            if (!seenX.has(xVal)) {
                seenX.add(xVal);
                xCategories.push(xVal);
            }
            if (!seenY.has(yVal)) {
                seenY.add(yVal);
                yCategories.push(yVal);
            }

            cells.push({ x: xVal, y: yVal, value: vNum });
        }

        return { cells, xCategories, yCategories };
    }, [dataset, xColumn, yColumn, valueColumn]);

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);

    // Band scales for X and Y axes
    const xScale = useMemo(() => {
        return scaleBand<string>()
            .domain(processed.xCategories)
            .range([0, innerWidth])
            .paddingInner(0.08)
            .paddingOuter(0.04);
    }, [processed.xCategories, innerWidth]);

    const yScale = useMemo(() => {
        return scaleBand<string>()
            .domain(processed.yCategories)
            .range([0, innerHeight])
            .paddingInner(0.08)
            .paddingOuter(0.04);
    }, [processed.yCategories, innerHeight]);

    // Determine the range of values for color mapping
    const valueExtent = useMemo(() => {
        const values = processed.cells.map(c => c.value);
        const computedMin = min(values) ?? 0;
        const computedMax = max(values) ?? 0;

        return {
            min: minValue ?? computedMin,
            max: maxValue ?? computedMax
        };
    }, [processed.cells, minValue, maxValue]);

    // Map values to colors using the interpolator
    const colorScale = useMemo(() => {
        const denom = valueExtent.max - valueExtent.min;
        return (value: number) => {
            if (!Number.isFinite(value)) return "#ccc";
            if (denom <= 0) return interpolator(0.7);
            const t = Math.max(0, Math.min(1, (value - valueExtent.min) / denom));
            return interpolator(t);
        };
    }, [valueExtent, interpolator]);

    const containerStyle: React.CSSProperties = {
        padding: padding || 10,
        margin: margin || 10,
        border: border ? "1px solid var(--dl2-border-main)" : undefined,
        boxShadow: shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
        flex: flex || 1,
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--dl2-bg-visual)",
        overflow: "hidden"
    };

    const formatCellLabel = (value: number) => {
        if (cellLabelFormatter) return cellLabelFormatter(value);
        return Number.isFinite(value) ? value.toLocaleString() : "";
    };

    if (!dataset || processed.cells.length === 0 || processed.xCategories.length === 0 || processed.yCategories.length === 0) {
        return (
            <div className="dl2-heatmap dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">{emptyLabel}</div>
            </div>
        );
    }

    const cellWidth = xScale.bandwidth();
    const cellHeight = yScale.bandwidth();

    const showGradientLegend = Number.isFinite(valueExtent.min) && Number.isFinite(valueExtent.max);

    return (
        <div className="dl2-heatmap dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Heatmap"}
                    style={{ display: "block", maxWidth: "100%" }}
                >
                    <defs>
                        {/* Gradient for the legend */}
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                            {Array.from({ length: 8 }).map((_, i) => {
                                const t = i / 7;
                                return (
                                    <stop
                                        key={i}
                                        offset={`${t * 100}%`}
                                        stopColor={interpolator(t)}
                                    />
                                );
                            })}
                        </linearGradient>
                    </defs>

                    <g transform={`translate(${resolvedMargin.left}, ${resolvedMargin.top})`}>
                        {/* Render Heatmap Cells */}
                        {processed.cells.map((cell, index) => {
                            const x = xScale(cell.x);
                            const y = yScale(cell.y);
                            if (x === undefined || y === undefined) return null;

                            const fill = colorScale(cell.value);
                            const stroke = "rgba(0,0,0,0.08)";
                            const isHovered = hoveredData?.xLabel === cell.x && hoveredData?.yLabel === cell.y;

                            return (
                                <g key={`${cell.x}-${cell.y}-${index}`} transform={`translate(${x}, ${y})`}>
                                    <rect
                                        width={cellWidth}
                                        height={cellHeight}
                                        fill={fill}
                                        stroke={isHovered ? "var(--dl2-text-main)" : stroke}
                                        strokeWidth={isHovered ? 2 : 1}
                                        onMouseEnter={(e) => {
                                            const rect = containerRef.current?.getBoundingClientRect();
                                            if (!rect) return;
                                            setHoveredData({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                                xLabel: cell.x,
                                                yLabel: cell.y,
                                                value: cell.value
                                            });
                                        }}
                                        onMouseMove={(e) => {
                                            const rect = containerRef.current?.getBoundingClientRect();
                                            if (!rect) return;
                                            setHoveredData({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                                xLabel: cell.x,
                                                yLabel: cell.y,
                                                value: cell.value
                                            });
                                        }}
                                        onMouseLeave={() => setHoveredData(null)}
                                        style={{ 
                                            transition: "all 0.2s",
                                            cursor: "pointer",
                                            filter: isHovered ? "brightness(1.1)" : "none"
                                        }}
                                    />

                                    {/* Optional value labels inside cells */}
                                    {showCellLabels && cellWidth >= 28 && cellHeight >= 18 && (
                                        <text
                                            x={cellWidth / 2}
                                            y={cellHeight / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize={Math.min(12, Math.max(9, Math.min(cellWidth, cellHeight) / 3))}
                                            fill="var(--dl2-text-main)"
                                            opacity={0.75}
                                        >
                                            {formatCellLabel(cell.value)}
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* X axis labels rendering */}
                        {showAxisLabels && (
                            <g transform={`translate(0, ${innerHeight})`} color="var(--dl2-text-main)">
                                {processed.xCategories.map((cat) => {
                                    const x = xScale(cat);
                                    if (x === undefined) return null;
                                    const cx = x + cellWidth / 2;
                                    return (
                                        <g key={cat} transform={`translate(${cx}, 0)`}>
                                            <line y2={6} stroke="currentColor" opacity={0.35} />
                                            <text
                                                y={18}
                                                textAnchor="end"
                                                fontSize={10}
                                                transform="rotate(-35)"
                                                fill="currentColor"
                                                opacity={0.8}
                                            >
                                                {cat}
                                            </text>
                                        </g>
                                    );
                                })}

                                {xAxisLabel && (
                                    <text
                                        x={innerWidth / 2}
                                        y={resolvedMargin.bottom - 18}
                                        textAnchor="middle"
                                        fontSize={12}
                                        fontWeight="bold"
                                        fill="currentColor"
                                    >
                                        {xAxisLabel}
                                    </text>
                                )}
                            </g>
                        )}

                        {/* Y axis labels rendering */}
                        {showAxisLabels && (
                            <g color="var(--dl2-text-main)">
                                {processed.yCategories.map((cat) => {
                                    const y = yScale(cat);
                                    if (y === undefined) return null;
                                    const cy = y + cellHeight / 2;
                                    return (
                                        <g key={cat} transform={`translate(0, ${cy})`}>
                                            <line x1={0} x2={-6} stroke="currentColor" opacity={0.35} />
                                            <text
                                                x={-10}
                                                textAnchor="end"
                                                dominantBaseline="middle"
                                                fontSize={10}
                                                fill="currentColor"
                                                opacity={0.8}
                                            >
                                                {cat}
                                            </text>
                                        </g>
                                    );
                                })}

                                {yAxisLabel && (
                                    <text
                                        transform={`translate(${-resolvedMargin.left + 18}, ${innerHeight / 2}) rotate(-90)`}
                                        textAnchor="middle"
                                        fontSize={12}
                                        fontWeight="bold"
                                        fill="currentColor"
                                    >
                                        {yAxisLabel}
                                    </text>
                                )}
                            </g>
                        )}

                        {/* Gradient legend rendering */}
                        {showGradientLegend && (
                            <g transform={`translate(0, ${innerHeight + 42})`} color="var(--dl2-text-main)">
                                <rect
                                    x={0}
                                    y={0}
                                    width={Math.min(innerWidth, 260)}
                                    height={10}
                                    fill={`url(#${gradientId})`}
                                    stroke="var(--dl2-border-main)"
                                />
                                <text x={0} y={24} fontSize={10} fill="currentColor" opacity={0.8}>
                                    {valueExtent.min.toLocaleString()}
                                </text>
                                <text
                                    x={Math.min(innerWidth, 260)}
                                    y={24}
                                    fontSize={10}
                                    textAnchor="end"
                                    fill="currentColor"
                                    opacity={0.8}
                                >
                                    {valueExtent.max.toLocaleString()}
                                </text>
                            </g>
                        )}
                    </g>
                </svg>

                {/* Floating Tooltip */}
                {hoveredData && (
                    <div
                        style={{
                            position: "absolute",
                            left: hoveredData.x + 15,
                            top: hoveredData.y - 10,
                            transform: "translateY(-100%)",
                            backgroundColor: "var(--dl2-bg-main)",
                            color: "var(--dl2-text-main)",
                            border: "1px solid var(--dl2-border-main)",
                            padding: "8px",
                            borderRadius: "4px",
                            pointerEvents: "none",
                            fontSize: "12px",
                            zIndex: 10,
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 4px var(--dl2-shadow)"
                        }}
                    >
                        <div style={{ fontWeight: "bold" }}>{hoveredData.yLabel} · {hoveredData.xLabel}</div>
                        <div>{hoveredData.value.toLocaleString()}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
