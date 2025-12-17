import React, { useMemo, useRef, useState, useEffect, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { scaleLinear, max, bin, min } from "d3";
import type { ReportVisual, ReportVisualElement, Dataset } from "../../lib/types";
import { ReportVisualElementsLayer } from "./elements/ReportVisualElementsLayer";

export interface HistogramProps extends ReportVisual {
    column?: string | number;
    bins?: number;
    title?: string;
    width?: number;
    height?: number;
    xAxisLabel?: string;
    yAxisLabel?: string;
    chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
    color?: string;
    showLabels?: boolean;
}

const defaultMargin = { top: 20, right: 20, bottom: 50, left: 50 };

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

    const processedData = useMemo(() => {
        if (!dataset) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const colIdx = findColumnIndex(column, dataset);
        if (colIdx === undefined) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const colName = dataset.columns[colIdx];

        const data = dataset.data.map(row => {
            let val;
            if (dataset.format === 'records' || !Array.isArray(row)) {
                val = row[colName];
            } else {
                val = row[colIdx];
            }
            return typeof val === 'number' ? val : parseFloat(val);
        }).filter(val => !isNaN(val));

        if (data.length === 0) return { binsData: [], xDomain: [0, 1], yMax: 0 };

        const minValue = min(data) ?? 0;
        const maxValue = max(data) ?? 1;
        
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
        return <div className="p-4 text-red-500">Dataset not found: {datasetId}</div>;
    }

    return (
        <div 
            ref={containerRef}
            className="relative flex flex-col"
            style={{ 
                padding, 
                margin, 
                border, 
                boxShadow: shadow,
                width: '100%',
                maxWidth: width 
            }}
        >
            {title && <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mb-4 text-center">{description}</p>}
            
            <div className="relative" style={{ height: height }}>
                <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`}>
                    <g transform={`translate(${resolvedMargin.left},${resolvedMargin.top})`}>
                        {/* Grid lines */}
                        {yScale.ticks(5).map(tickValue => (
                            <line
                                key={tickValue}
                                x1={0}
                                x2={innerWidth}
                                y1={yScale(tickValue)}
                                y2={yScale(tickValue)}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                        ))}

                        {/* Bars */}
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
                                    height={barHeight}
                                    fill={color}
                                    opacity={hoveredBin === d ? 0.8 : 1}
                                    onMouseEnter={() => setHoveredBin(d)}
                                    onMouseLeave={() => setHoveredBin(null)}
                                />
                            );
                        })}

                        {/* X Axis */}
                        <g transform={`translate(0,${innerHeight})`}>
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

                        {/* Y Axis */}
                        <g>
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

                        {/* Labels */}
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
                                    fill="currentColor"
                                >
                                    {d.length}
                                </text>
                            );
                        })}
                        
                        {/* Other Elements Layer */}
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

                {/* Tooltip */}
                {hoveredBin && (
                    <div
                        className="absolute bg-white p-2 rounded shadow-lg border border-gray-200 text-xs pointer-events-none z-10"
                        style={{
                            left: resolvedMargin.left + xScale(hoveredBin.x0 ?? 0) + (xScale(hoveredBin.x1 ?? 0) - xScale(hoveredBin.x0 ?? 0)) / 2,
                            top: resolvedMargin.top + yScale(hoveredBin.length) - 10,
                            transform: 'translate(-50%, -100%)'
                        }}
                    >
                        <div className="font-semibold">Range: {hoveredBin.x0} - {hoveredBin.x1}</div>
                        <div>Count: {hoveredBin.length}</div>
                    </div>
                )}
            </div>
        </div>
    );
};
