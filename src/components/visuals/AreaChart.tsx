import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scalePoint, scaleLinear, scaleOrdinal, max, schemeTableau10, line, area, curveLinear, curveMonotoneX } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset, ColorProperty, ThresholdConfig } from "../../lib/types";
import { VisualLegend, VisualLegendItem } from "./VisualLegend";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";
import { resolveColors } from "../../lib/color-utility";
import { isDate, printDate } from "../../lib/date-utility";

/**
 * Props for the AreaChart component.
 */
export interface AreaChartProps extends ReportVisual {
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
    /** Color or color palette for the areas. */
    colors?: ColorProperty;
    /** Whether to show the legend. Defaults to true. */
    showLegend?: boolean;
    legendTitle?: string;
    /** Whether to show value labels above points. Defaults to false. */
    showLabels?: boolean;
    /** Whether to use monotone cubic interpolation for smooth curves. Defaults to false. */
    smooth?: boolean;
    /** 
     * Optional threshold configuration for pass/fail coloring.
     * When provided, lines, areas, and markers will be colored based on whether values pass or fail the threshold.
     * Colors will seamlessly blend at threshold crossing points.
     */
    threshold?: ThresholdConfig;
    /** 
     * Opacity of the area fill (0-1). Defaults to 0.3.
     * Set to 0 to hide the fill and show only the line.
     */
    fillOpacity?: number;
    /** Whether to show the line stroke on top of the area. Defaults to true. */
    showLine?: boolean;
    /** Whether to show interactive markers/points. Defaults to true. */
    showMarkers?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

/**
 * AreaChart Component
 * Renders a multi-series area chart with filled regions below the lines.
 * Supports threshold-based coloring with smooth gradient transitions.
 */
export const AreaChart: React.FC<AreaChartProps> = ({
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
    smooth = false,
    threshold,
    fillOpacity = 0.3,
    showLine = true,
    showMarkers = true
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

    // Process dataset into a format suitable for multi-series rendering
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
            blendWidth: Math.max(0, Math.min(50, threshold.blendWidth ?? 5)), // Clamp between 0-50%
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

    /**
     * Generate threshold-based gradient definitions for smooth color transitions.
     * The gradient is oriented along the x-axis and blends colors around threshold crossings.
     */
    const thresholdGradients = useMemo(() => {
        if (!thresholdConfig || innerWidth === 0) return {};

        const gradients: Record<string, { id: string; stops: Array<{ offset: string; color: string }> }> = {};
        const blendWidth = thresholdConfig.blendWidth; // Percentage of chart width for blend zone

        keys.forEach((key) => {
            const seriesData = data.map(d => ({ x: d.x, value: d[key] }));
            const gradientId = `area-threshold-gradient-${key.replace(/\s+/g, '-')}`;
            const stops: Array<{ offset: string; color: string }> = [];

            for (let i = 0; i < seriesData.length; i++) {
                const point = seriesData[i];
                const xPos = xScale(point.x) ?? 0;
                const offsetPercent = (xPos / innerWidth) * 100;
                const color = passesThreshold(point.value) ? thresholdConfig.passColor : thresholdConfig.failColor;

                // Check for threshold crossing between this point and the previous
                if (i > 0) {
                    const prevPoint = seriesData[i - 1];
                    const prevXPos = xScale(prevPoint.x) ?? 0;
                    const prevPasses = passesThreshold(prevPoint.value);
                    const currPasses = passesThreshold(point.value);

                    if (prevPasses !== currPasses) {
                        // Calculate the interpolated crossing point
                        const thresholdVal = thresholdConfig.value;
                        const t = (thresholdVal - prevPoint.value) / (point.value - prevPoint.value);
                        const crossingX = prevXPos + t * (xPos - prevXPos);
                        const crossingOffset = (crossingX / innerWidth) * 100;

                        const prevColor = prevPasses ? thresholdConfig.passColor : thresholdConfig.failColor;
                        const currColor = currPasses ? thresholdConfig.passColor : thresholdConfig.failColor;

                        if (blendWidth > 0) {
                            // Create a smooth blend zone around the crossing point
                            const blendStart = Math.max(0, crossingOffset - blendWidth);
                            const blendEnd = Math.min(100, crossingOffset + blendWidth);
                            
                            stops.push({ offset: `${blendStart}%`, color: prevColor });
                            stops.push({ offset: `${blendEnd}%`, color: currColor });
                        } else {
                            // Hard edge at the crossing point
                            stops.push({ offset: `${crossingOffset}%`, color: prevColor });
                            stops.push({ offset: `${crossingOffset}%`, color: currColor });
                        }
                    }
                }

                // Add stop for current point
                stops.push({ offset: `${offsetPercent}%`, color: color });
            }

            // Sort stops by offset and remove duplicates
            stops.sort((a, b) => parseFloat(a.offset) - parseFloat(b.offset));

            gradients[key] = { id: gradientId, stops };
        });

        return gradients;
    }, [thresholdConfig, keys, data, xScale, innerWidth, passesThreshold]);

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

    // D3 Area generator with optional smoothing
    const areaGenerator = useMemo(() => {
        return area<any>()
            .x(d => xScale(d.x) ?? 0)
            .y0(innerHeight)
            .y1(d => yScale(d.value))
            .curve(smooth ? curveMonotoneX : curveLinear);
    }, [xScale, yScale, innerHeight, smooth]);

    // Clamp fill opacity between 0 and 1
    const clampedFillOpacity = Math.max(0, Math.min(1, fillOpacity));

    if (!dataset || data.length === 0) {
        return (
            <div className="dl2-area-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }

    return (
        <div className="dl2-area-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Area Chart"}
                    style={{ display: "block", maxWidth: "100%" }}
                >
                    {/* Gradient definitions for threshold-based coloring */}
                    <defs>
                        {thresholdConfig && Object.entries(thresholdGradients).map(([key, gradient]) => (
                            <linearGradient
                                key={gradient.id}
                                id={gradient.id}
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="0%"
                            >
                                {gradient.stops.map((stop, idx) => (
                                    <stop
                                        key={`${stop.offset}-${idx}`}
                                        offset={stop.offset}
                                        stopColor={stop.color}
                                    />
                                ))}
                            </linearGradient>
                        ))}
                    </defs>
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

                        {/* Render Areas, Lines, and Points for each series */}
                        {keys.map((key) => {
                            const seriesData = data.map(d => ({ x: d.x, value: d[key] }));
                            const areaPath = areaGenerator(seriesData);
                            const linePath = lineGenerator(seriesData);
                            const baseColor = colorScale(key);
                            const gradient = thresholdGradients[key];
                            
                            // Use gradient if threshold is configured and applyTo includes lines
                            const applyToLines = thresholdConfig && (thresholdConfig.applyTo === 'both' || thresholdConfig.applyTo === 'lines');
                            const fillColor = applyToLines && gradient 
                                ? `url(#${gradient.id})` 
                                : baseColor;
                            const strokeColor = applyToLines && gradient 
                                ? `url(#${gradient.id})` 
                                : baseColor;

                            return (
                                <g key={key}>
                                    {/* Area Fill */}
                                    {clampedFillOpacity > 0 && (
                                        <path
                                            d={areaPath || ""}
                                            fill={fillColor}
                                            fillOpacity={clampedFillOpacity}
                                            stroke="none"
                                        />
                                    )}
                                    
                                    {/* Line Stroke */}
                                    {showLine && (
                                        <path
                                            d={linePath || ""}
                                            fill="none"
                                            stroke={strokeColor}
                                            strokeWidth={2}
                                        />
                                    )}
                                    
                                    {/* Interactive Points */}
                                    {showMarkers && seriesData.map((d, i) => {
                                        const cx = xScale(d.x);
                                        const cy = yScale(d.value);
                                        // Use threshold color for marker if configured and applyTo includes markers
                                        const applyToMarkers = thresholdConfig && (thresholdConfig.applyTo === 'both' || thresholdConfig.applyTo === 'markers');
                                        const markerColor = applyToMarkers ? (getThresholdColor(d.value) || baseColor) : baseColor;
                                        
                                        if (cx === undefined) return null;

                                        return (
                                            <g key={i}>
                                                <circle
                                                    cx={cx}
                                                    cy={cy}
                                                    r={hoveredData?.label === d.x && hoveredData?.series === key ? 7 : 4}
                                                    fill={markerColor}
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
                        left: hoveredData.x + 15,
                        top: hoveredData.y - 10,
                        transform: "translateY(-100%)",
                        backgroundColor: "rgba(0, 0, 0, 0.8)",
                        color: "white",
                        padding: "8px",
                        borderRadius: "4px",
                        pointerEvents: "none",
                        fontSize: "12px",
                        zIndex: 10,
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
