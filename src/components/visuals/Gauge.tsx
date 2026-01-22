import React, { useContext, useMemo, useRef, useState, useEffect } from "react";
import { arc, scaleLinear, pointer } from "d3";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset, ColorProperty } from "../../lib/types";
import { findColumnIndex } from "../../lib/dataset-utility";
import { resolveColors, getColor } from "../../lib/color-utility";

export interface GaugeRange {
    from: number;
    to: number;
    color?: string;
    label?: string;
}

/**
 * Props for the Gauge component.
 */
export interface GaugeProps extends ReportVisual {
    /** Column name or index to use for the gauge value. Defaults to 0. */
    valueColumn?: string | number;
    /** Row index to read the value from. Defaults to 0. */
    rowIndex?: number;
    /** Minimum value for the gauge scale. Defaults to 0. */
    minValue?: number;
    /** Maximum value for the gauge scale. Defaults to 100. */
    maxValue?: number;
    /** Optional title for the gauge. */
    title?: string;
    /** Optional width for the gauge. */
    width?: number;
    /** Optional height for the gauge. */
    height?: number;
    /** Gauge arc thickness in pixels. */
    thickness?: number;
    /** Start angle in radians. Defaults to -3/4 PI. */
    startAngle?: number;
    /** End angle in radians. Defaults to 3/4 PI. */
    endAngle?: number;
    /** Color palette used for ranges and value arc. */
    colors?: ColorProperty;
    /** Range bands for the gauge (colored segments). */
    ranges?: GaugeRange[];
    /** Color for the track when ranges are not provided. */
    trackColor?: string;
    /** Color for the value arc when ranges are not provided. */
    valueColor?: string;
    /** Color of the needle. */
    needleColor?: string;
    /** Whether to show the needle. Defaults to true. */
    showNeedle?: boolean;
    /** Whether to show the center value. Defaults to true. */
    showValue?: boolean;
    /** Whether to show min/max labels. Defaults to true. */
    showMinMax?: boolean;
    /** Display format for the value. */
    format?: "number" | "currency" | "percent";
    /** Rounding precision for the value. */
    roundingPrecision?: number;
    /** Currency symbol to use when format is 'currency'. Defaults to '$'. */
    currencySymbol?: string;
    /** Optional unit to display under the value. */
    unit?: string;
    /** Custom margins for the chart area. */
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
}

const defaultMargin = { top: 20, right: 20, bottom: 20, left: 20 };

export const Gauge: React.FC<GaugeProps> = ({
    valueColumn = 0,
    rowIndex = 0,
    datasetId,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
    width = 360,
    height = 240,
    thickness = 24,
    startAngle = -Math.PI * 0.5,
    endAngle = Math.PI * 0.5,
    minValue = 0,
    maxValue = 100,
    colors,
    ranges,
    trackColor = "var(--dl2-border-table)",
    valueColor,
    needleColor = "var(--dl2-text-main)",
    showNeedle = true,
    showValue = true,
    showMinMax = true,
    format = "number",
    roundingPrecision = 1,
    currencySymbol = "$",
    unit,
    chartMargin
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipData, setTooltipData] = useState<{ x: number; y: number; value: number; percent: number } | null>(null);

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

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    const value = useMemo(() => {
        if (!dataset || !Array.isArray(dataset.data) || dataset.data.length === 0) return null;

        const resolveRowIndex = (index: number, length: number): number => {
            if (index < 0) return length + index;
            return index;
        };

        const resolvedRowIndex = resolveRowIndex(rowIndex, dataset.data.length);
        if (resolvedRowIndex < 0 || resolvedRowIndex >= dataset.data.length) return null;

        const colIdx = findColumnIndex(valueColumn, dataset as Dataset);
        const colName = colIdx !== undefined ? dataset.columns[colIdx] : undefined;

        const row = dataset.data[resolvedRowIndex];
        if (row === undefined || row === null) return null;

        let rawValue: any;
        if (dataset.format === "records" || dataset.format === "record") {
            if (colName) {
                rawValue = row[colName];
            } else if (typeof valueColumn === "string") {
                rawValue = row[valueColumn];
            } else {
                rawValue = row[0];
            }
        } else if (dataset.format === "list") {
            rawValue = row;
        } else {
            rawValue = row[colIdx ?? 0];
        }

        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue)) return null;

        return numericValue;
    }, [dataset, valueColumn, rowIndex]);

    const formattedValue = useMemo(() => {
        if (value === null) return "";
        if (format === "currency") {
            return `${currencySymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: roundingPrecision })}`;
        }
        if (format === "percent") {
            return `${(value * 100).toFixed(roundingPrecision)}%`;
        }
        const rounded = Number(value.toFixed(roundingPrecision));
        return rounded.toLocaleString();
    }, [value, format, roundingPrecision, currencySymbol]);

    if (!dataset || value === null) {
        return (
            <div
                className="dl2-gauge dl2-visual-container"
                style={{
                    padding: padding || 10,
                    margin: margin || 10,
                    border: border ? "1px solid var(--dl2-border-main)" : undefined,
                    boxShadow: shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
                    minHeight: height,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "var(--dl2-bg-visual)",
                    flex: flex || 1
                }}
            >
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);
    const radius = Math.max(0, Math.min(innerWidth / 2, innerHeight * 0.85));
    const innerRadius = Math.max(0, radius - thickness);

    // For SVG, angles are measured from 3 o'clock going clockwise
    // We want gauge to go from bottom-left to bottom-right
    // So we use negative angles (counter-clockwise from 3 o'clock = upward)
    const angleScale = useMemo(() => {
        return scaleLinear()
            .domain([minValue, maxValue])
            .range([startAngle, endAngle])
            .clamp(true);
    }, [minValue, maxValue, startAngle, endAngle]);

    const centerX = resolvedMargin.left + innerWidth / 2;
    const centerY = resolvedMargin.top + radius;

    const arcGenerator = useMemo(() => {
        return arc<any>()
            .innerRadius(innerRadius)
            .outerRadius(radius);
    }, [innerRadius, radius]);

    const clampedValue = Math.min(Math.max(value, minValue), maxValue);
    const valueAngle = angleScale(clampedValue);
    const baseArcPath = arcGenerator({ startAngle, endAngle });
    const valueArcPath = arcGenerator({ startAngle, endAngle: valueAngle });

    const normalizedRanges = useMemo(() => {
        if (!ranges || ranges.length === 0) return [];
        return ranges
            .map((range) => ({
                ...range,
                from: Math.max(minValue, range.from),
                to: Math.min(maxValue, range.to)
            }))
            .filter((range) => range.to > range.from)
            .sort((a, b) => a.from - b.from);
    }, [ranges, minValue, maxValue]);

    const activeRange = useMemo(() => {
        if (!normalizedRanges.length) return undefined;
        return normalizedRanges.find((range) => clampedValue >= range.from && clampedValue <= range.to);
    }, [normalizedRanges, clampedValue]);

    // D3 arc angles: 0 = 12 o'clock, positive = clockwise
    // To convert to SVG x/y: x = sin(angle), y = -cos(angle)
    const needleLength = radius * 0.85;
    const needleTipX = Math.sin(valueAngle) * needleLength;
    const needleTipY = -Math.cos(valueAngle) * needleLength;
    const needleBase = Math.max(10, thickness * 0.5);
    const needleLeft = {
        x: Math.cos(valueAngle) * (needleBase / 2),
        y: Math.sin(valueAngle) * (needleBase / 2)
    };
    const needleRight = {
        x: -Math.cos(valueAngle) * (needleBase / 2),
        y: -Math.sin(valueAngle) * (needleBase / 2)
    };

    // Position min/max labels just past the arc ends
    const labelRadius = radius + 16;
    const startLabelX = Math.sin(startAngle) * labelRadius;
    const startLabelY = -Math.cos(startAngle) * labelRadius;
    const endLabelX = Math.sin(endAngle) * labelRadius;
    const endLabelY = -Math.cos(endAngle) * labelRadius;

    const resolvedValueColor = valueColor || activeRange?.color || getColor(resolvedColors, 0, "#4c9aff");
    const percentOfRange = maxValue > minValue ? (clampedValue - minValue) / (maxValue - minValue) : 0;

    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
        const svg = event.currentTarget;
        const [x, y] = pointer(event, svg);
        setIsHovered(true);
        setTooltipData({
            x,
            y,
            value: clampedValue,
            percent: percentOfRange
        });
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        setTooltipData(null);
    };

    return (
        <div
            ref={containerRef}
            className="dl2-gauge dl2-visual-container"
            style={{
                padding: padding || 10,
                margin: margin || 10,
                border: border ? "1px solid var(--dl2-border-main)" : undefined,
                boxShadow: shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
                backgroundColor: "var(--dl2-bg-visual)",
                flex: flex || 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch"
            }}
        >
            {title && <h3 className="dl2-chart-title" style={{ textAlign: "center", marginBottom: 4 }}>{title}</h3>}
            {description && <p className="dl2-chart-description" style={{ textAlign: "center", marginTop: 0 }}>{description}</p>}

            <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
                <svg
                    width={chartWidth}
                    height={height}
                    role="img"
                    aria-label={title ?? "Gauge"}
                    style={{ display: "block" }}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <g transform={`translate(${centerX}, ${centerY})`}>
                        {/* Base track */}
                        {!normalizedRanges.length && baseArcPath && (
                            <path d={baseArcPath} fill={trackColor} opacity={0.25} />
                        )}

                        {/* Range bands */}
                        {normalizedRanges.map((range, index) => {
                            const rangePath = arcGenerator({
                                startAngle: angleScale(range.from),
                                endAngle: angleScale(range.to)
                            });

                            if (!rangePath) return null;
                            const fill = range.color || getColor(resolvedColors, index, trackColor);

                            return (
                                <path
                                    key={`${range.from}-${range.to}-${index}`}
                                    d={rangePath}
                                    fill={fill}
                                    opacity={0.9}
                                />
                            );
                        })}

                        {/* Value arc - only shown when no ranges are defined */}
                        {!normalizedRanges.length && valueArcPath && (
                            <path
                                d={valueArcPath}
                                fill={resolvedValueColor}
                                opacity={isHovered ? 0.9 : 1}
                                style={{ transition: "opacity 0.2s" }}
                            />
                        )}

                        {/* Needle */}
                        {showNeedle && (
                            <g>
                                <polygon
                                    points={`${needleLeft.x},${needleLeft.y} ${needleRight.x},${needleRight.y} ${needleTipX},${needleTipY}`}
                                    fill={needleColor}
                                />
                                <circle cx={0} cy={0} r={10} fill={needleColor} />
                                <circle cx={0} cy={0} r={5} fill="var(--dl2-bg-visual)" />
                            </g>
                        )}

                        {/* Value text - positioned below the center */}
                        {showValue && (
                            <text
                                x={0}
                                y={radius * 0.35}
                                textAnchor="middle"
                                fontSize={22}
                                fontWeight={700}
                                fill={resolvedValueColor}
                                className="dl2-gauge-value"
                            >
                                {formattedValue}
                            </text>
                        )}
                        {showValue && unit && (
                            <text
                                x={0}
                                y={radius * 0.35 + 18}
                                textAnchor="middle"
                                fontSize={13}
                                fontWeight={500}
                                fill="var(--dl2-text-muted)"
                                className="dl2-gauge-unit"
                            >
                                {unit}
                            </text>
                        )}
                        {showValue && activeRange?.label && (
                            <text
                                x={0}
                                y={radius * 0.35 + (unit ? 36 : 18)}
                                textAnchor="middle"
                                fontSize={13}
                                fontWeight={600}
                                fill={activeRange.color || resolvedValueColor}
                                className="dl2-gauge-status"
                            >
                                {activeRange.label}
                            </text>
                        )}

                        {/* Min/Max labels */}
                        {showMinMax && (
                            <>
                                <text
                                    x={startLabelX}
                                    y={startLabelY}
                                    textAnchor="end"
                                    dominantBaseline="hanging"
                                    fontSize={14}
                                    fontWeight={600}
                                    style={{ fill: "var(--dl2-text-main)" }}
                                    className="dl2-gauge-minmax"
                                >
                                    {minValue}
                                </text>
                                <text
                                    x={endLabelX}
                                    y={endLabelY}
                                    textAnchor="start"
                                    dominantBaseline="hanging"
                                    fontSize={14}
                                    fontWeight={600}
                                    style={{ fill: "var(--dl2-text-main)" }}
                                    className="dl2-gauge-minmax"
                                >
                                    {maxValue}
                                </text>
                            </>
                        )}
                    </g>
                </svg>
                {tooltipData && (
                    <div
                        style={{
                            position: "absolute",
                            left: tooltipData.x,
                            top: tooltipData.y,
                            transform: "translate(-50%, -110%)",
                            backgroundColor: "var(--dl2-bg-main)",
                            color: "var(--dl2-text-main)",
                            border: "1px solid var(--dl2-border-main)",
                            padding: "8px",
                            borderRadius: "6px",
                            pointerEvents: "none",
                            fontSize: "12px",
                            zIndex: 10,
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 6px var(--dl2-shadow)"
                        }}
                    >
                        <div style={{ fontWeight: 600 }}>Value: {formattedValue}</div>
                        <div>Range: {(tooltipData.percent * 100).toFixed(1)}%</div>
                    </div>
                )}
            </div>
        </div>
    );
};
