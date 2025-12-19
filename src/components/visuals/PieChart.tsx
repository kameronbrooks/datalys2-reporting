import React, { useMemo, useRef, useState, useEffect } from "react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { arc, pie, scaleOrdinal, schemeTableau10 } from "d3";
import type { PieArcDatum } from "d3";
import type { ReportVisual, Dataset, ColorProperty } from "../../lib/types";
import { VisualLegend } from "./VisualLegend";
import { resolveColors } from "../../lib/color-utility";

export interface PieChartDatum {
    id?: string;
    label: string;
    value: number;
    color?: string;
}

/**
 * Props for the PieChart component.
 * @interface PieChartProps
 * @extends ReportVisual
 * @property {string|number} [categoryColumn] - The column index or name for categories.
 * @property {string|number} [valueColumn] - The column index or name for values.
 * @property {string} [title] - The title of the pie chart.
 * @property {number} [width] - The width of the pie chart in pixels.
 * @property {number} [height] - The height of the pie chart in pixels.
 * @property {number} [innerRadius] - The inner radius of the pie chart (for donut charts).
 * @property {number} [cornerRadius] - The corner radius for pie slices.
 * @property {number} [padAngle] - The padding angle between pie slices.
 * @property {Partial<Record<"top" | "right" | "bottom" | "left", number>>} [chartMargin] - The margin around the chart area.
 * @property {string[]} [colors] - An array of colors to use for the pie slices.
 */
export interface PieChartProps extends ReportVisual {
    categoryColumn?: string | number;
    valueColumn?: string | number;
    title?: string;
    width?: number;
    height?: number;
    innerRadius?: number;
    cornerRadius?: number;

    padAngle?: number;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    colors?: ColorProperty;
    showLegend?: boolean;
    legendTitle?: string;

}

const defaultMargin = { top: 50, right: 50, bottom: 50, left: 50 }

export const PieChart: React.FC<PieChartProps> = ({
    categoryColumn = 0,
    valueColumn = 1,
    datasetId,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
    width = 320,
    height = 320,
    innerRadius = 40,
    cornerRadius = 0,
    padAngle = 0.00,
    chartMargin,
    colors,
    showLegend = true,
    legendTitle
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(width);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltipData, setTooltipData] = useState<{ x: number, y: number, label: string, value: number, percentage: number } | null>(null);

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

    const findColumnIndex = (column: string | number, dataset: Dataset): number | undefined => {
        if ((typeof column === "number") && (column >= 0) && (column < dataset.columns.length)) {
            return column;
        } else if (typeof column === "string") {
            const colIndex = dataset.columns.indexOf(column);
            return colIndex >= 0 ? colIndex : 0;
        }
        return undefined;
    }

    const generatePieChartDatum = (dataset: Dataset): PieChartDatum[] => {
        if (!dataset) return [];
        const catIdx = findColumnIndex(categoryColumn, dataset);
        const valIdx = findColumnIndex(valueColumn, dataset);
        return dataset.data.map((row) => ({
            label: String(row[catIdx ?? 0]),
            value: Number(row[valIdx ?? 1])
        }));
    }

    const ctx = useContext(AppContext) || { datasets: {} };
    const data = generatePieChartDatum(ctx.datasets[datasetId]) as PieChartDatum[];

    const resolvedMargin = useMemo(() => ({
        top: chartMargin?.top ?? defaultMargin.top,
        right: chartMargin?.right ?? defaultMargin.right,
        bottom: chartMargin?.bottom ?? defaultMargin.bottom,
        left: chartMargin?.left ?? defaultMargin.left
    }), [chartMargin]);

    const sanitizedData = useMemo(
        () => data.filter((datum) => Number.isFinite(datum.value)),
        [data]
    );

    const pieData = useMemo(
        () => pie<PieChartDatum>()
            .sort(null)
            .value((datum: any) => Math.max(0, datum.value))(sanitizedData),
        [sanitizedData]
    );

    const totalValue = useMemo(
        () => pieData.reduce((total: any, datum: PieArcDatum<PieChartDatum>) => total + datum.value, 0),
        [pieData]
    );

    const chartHeight = height;

    const innerWidth = Math.max(0, chartWidth - resolvedMargin.left - resolvedMargin.right);
    const innerHeight = Math.max(0, chartHeight - resolvedMargin.top - resolvedMargin.bottom);

    const radius = Math.max(0, Math.min(innerWidth, innerHeight) / 2 * 0.75);
    const actualInnerRadius = Math.min(Math.max(0, innerRadius), radius);

    const mainArc = useMemo(
        () => arc<PieArcDatum<PieChartDatum>>()
            .innerRadius(actualInnerRadius)
            .outerRadius(radius)
            .padAngle(padAngle)
            .cornerRadius(cornerRadius),
        [actualInnerRadius, radius, padAngle, cornerRadius]
    );

    const hoverArc = useMemo(
        () => arc<PieArcDatum<PieChartDatum>>()
            .innerRadius(actualInnerRadius)
            .outerRadius(radius * 1.05)
            .padAngle(padAngle)
            .cornerRadius(cornerRadius),
        [actualInnerRadius, radius, padAngle, cornerRadius]
    );

    const labelArc = useMemo(
        () => arc<PieArcDatum<PieChartDatum>>()
            .innerRadius(radius * 1.1)
            .outerRadius(radius * 1.1),
        [radius]
    );

    const resolvedColors = useMemo(() => resolveColors(colors), [colors]);

    const colorScale = useMemo(() => {
        if (resolvedColors && resolvedColors.length > 0) {
            return scaleOrdinal<string, string>()
                .domain(sanitizedData.map((datum) => datum.label))
                .range(resolvedColors);
        }

        return scaleOrdinal<string, string>()
            .domain(sanitizedData.map((datum) => datum.label))
            .range(schemeTableau10);
    }, [resolvedColors, sanitizedData]);

    const containerStyle: React.CSSProperties = {
        padding: padding || 10,
        margin: margin || 10,
        border: border ? "1px solid #ccc" : undefined,
        boxShadow: shadow ? "2px 2px 5px rgba(0, 0, 0, 0.1)" : undefined,
        minHeight: "300px",
        display: "flex",
        flexDirection: "column",
        flex: "1"
    };

    const legendItems = useMemo(
        () => pieData.map((datum: PieArcDatum<PieChartDatum>, index: number) => {
            const label = datum.data.label;
            const value = datum.value;
            const percentage = totalValue > 0 ? (value / totalValue) * 100 : 0;
            const fill = datum.data.color ?? colorScale(label);

            return {
                key: datum.data.id ?? `${label}-${index}`,
                label,
                value,
                percentage,
                fill
            };
        }),
        [pieData, colorScale, totalValue]
    );

    if (!sanitizedData.length) {
        return (
            <div className="dl2-pie-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
                {title && <h3 className="dl2-chart-title">{title}</h3>}
                {description && <p className="dl2-chart-description">{description}</p>}
                <div className="dl2-chart-empty">No data available.</div>
            </div>
        );
    }
    return (
        <div className="dl2-pie-chart dl2-visual-container" style={containerStyle} ref={containerRef}>
            {title && <h3 className="dl2-chart-title">{title}</h3>}
            {description && <p className="dl2-chart-description">{description}</p>}

            <div style={{ flex: 1, width: "100%", minHeight: 0, position: "relative" }}>
                <svg
                    className="dl2-chart-svg"
                    width={chartWidth}
                    height={chartHeight}
                    role="img"
                    aria-label={title ?? "Pie chart"}
                    style={{ display: "block", maxWidth: "100%" }}
                >
                    <g transform={`translate(${resolvedMargin.left + innerWidth / 2}, ${resolvedMargin.top + innerHeight / 2})`}>
                        {pieData.map((datum: PieArcDatum<PieChartDatum>, index: number) => {
                            const isHovered = hoveredIndex === index;
                            const path = isHovered ? hoverArc(datum) : mainArc(datum);
                            if (!path) {
                                return null;
                            }

                            const fill = datum.data.color ?? colorScale(datum.data.label);
                            const shouldShowLabel = totalValue > 0 ? datum.value / totalValue >= 0.02 : false;

                            const posA = mainArc.centroid(datum);
                            const posB = labelArc.centroid(datum);
                            const midAngle = datum.startAngle + (datum.endAngle - datum.startAngle) / 2;
                            const isRight = midAngle < Math.PI;
                            const posC = [radius * 1.2 * (isRight ? 1 : -1), posB[1]];
                            const textAnchor = isRight ? "start" : "end";

                            return (
                                <g
                                    key={datum.data.id ?? `${datum.data.label}-${index}`}
                                    onMouseEnter={(e) => {
                                        setHoveredIndex(index);
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltipData({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                                label: datum.data.label,
                                                value: datum.value,
                                                percentage: totalValue > 0 ? (datum.value / totalValue) * 100 : 0
                                            });
                                        }
                                    }}
                                    onMouseMove={(e) => {
                                        const rect = containerRef.current?.getBoundingClientRect();
                                        if (rect) {
                                            setTooltipData({
                                                x: e.clientX - rect.left,
                                                y: e.clientY - rect.top,
                                                label: datum.data.label,
                                                value: datum.value,
                                                percentage: totalValue > 0 ? (datum.value / totalValue) * 100 : 0
                                            });
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        setHoveredIndex(null);
                                        setTooltipData(null);
                                    }}
                                    style={{ cursor: "pointer", opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.6 : 1, transition: "opacity 0.2s" }}
                                >
                                    <path
                                        d={path}
                                        fill={fill}
                                        stroke="#ffffff"
                                        strokeWidth={1}
                                        style={{ transition: "d 0.2s ease-in-out" }}
                                    />
                                    {shouldShowLabel && (
                                        <>
                                            <polyline
                                                points={`${posA},${posB},${posC}`}
                                                fill="none"
                                                stroke={fill}
                                                strokeWidth={1}
                                            />
                                            <text
                                                x={posC[0] + (isRight ? 5 : -5)}
                                                y={posC[1]}
                                                textAnchor={textAnchor}
                                                dominantBaseline="middle"
                                                className="dl2-pie-chart-label"
                                                fill={fill}
                                                style={{ fontSize: "12px", fontWeight: "bold" }}
                                            >
                                                {datum.data.label}
                                            </text>
                                        </>
                                    )}
                                </g>
                            );
                        })}
                    </g>
                </svg>
                {tooltipData && (
                    <div style={{
                        position: "absolute",
                        left: tooltipData.x,
                        top: tooltipData.y,
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
                        <div style={{ fontWeight: "bold" }}>{tooltipData.label}</div>
                        <div>{tooltipData.value.toLocaleString()} ({tooltipData.percentage.toFixed(1)}%)</div>
                    </div>
                )}
            </div>
            {showLegend && legendItems.length > 0 && (
                <VisualLegend
                    title={legendTitle}
                    items={legendItems}
                />
            )}
        </div>
    );
};
