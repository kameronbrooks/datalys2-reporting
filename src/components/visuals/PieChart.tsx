import React, { useMemo, useRef, useState, useEffect } from "react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { arc, pie, scaleOrdinal, schemeTableau10 } from "d3";
import type { PieArcDatum } from "d3";
import type { ReportVisual, Dataset } from "../../lib/types";

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
    categoryColumn?: string|number;
    valueColumn?: string|number;
	title?: string;
	width?: number;
	height?: number;
	innerRadius?: number;
	cornerRadius?: number;
    
	padAngle?: number;
	chartMargin?: Partial<Record<"top" | "right" | "bottom" | "left", number>>;
	colors?: string[];
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
    const [isLegendCollapsed, setIsLegendCollapsed] = useState(false);

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

    const findColumnIndex = (column: string|number, dataset: Dataset): number | undefined => {
        if ((typeof column === 'number') && (column >= 0) && (column < dataset.columns.length) ) {
            return column;
        } else if (typeof column === 'string') {
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

    const ctx = useContext(AppContext) || {datasets: {}};
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
			.value((datum:any) => Math.max(0, datum.value))(sanitizedData),
		[sanitizedData]
	);

	const totalValue = useMemo(
		() => pieData.reduce((total:any, datum:PieArcDatum<PieChartDatum>) => total + datum.value, 0),
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

	const labelArc = useMemo(
		() => arc<PieArcDatum<PieChartDatum>>()
			.innerRadius(radius * 1.1)
			.outerRadius(radius * 1.1),
		[radius]
	);

	const colorScale = useMemo(() => {
		if (colors && colors.length > 0) {
			return scaleOrdinal<string, string>()
				.domain(sanitizedData.map((datum) => datum.label))
				.range(colors);
		}

		return scaleOrdinal<string, string>()
			.domain(sanitizedData.map((datum) => datum.label))
			.range(schemeTableau10);
	}, [colors, sanitizedData]);

	const containerStyle: React.CSSProperties = {
		padding: padding || 10,
		margin: margin || 10,
		border: border ? '1px solid #ccc' : undefined,
		boxShadow: shadow ? '2px 2px 5px rgba(0, 0, 0, 0.1)' : undefined,
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        flex: '1'
	};

	const legendItems = useMemo(
		() => pieData.map((datum: PieArcDatum<PieChartDatum>, index:number) => {
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
			<div className="dl2-pie-chart" style={containerStyle} ref={containerRef}>
				{title && <h3 className="dl2-pie-chart-title">{title}</h3>}
				{description && <p className="dl2-pie-chart-description">{description}</p>}
				<div className="dl2-pie-chart-empty">No data available.</div>
			</div>
		);
	}
	return (
		<div className="dl2-pie-chart" style={containerStyle} ref={containerRef}>
			{title && <h3 className="dl2-pie-chart-title">{title}</h3>}
			{description && <p className="dl2-pie-chart-description">{description}</p>}

            <div style={{ flex: 1, width: '100%', minHeight: 0, position: 'relative' }}>
                <svg
                    className="dl2-pie-chart-svg"
                    width={chartWidth}
                    height={chartHeight}
                    role="img"
                    aria-label={title ?? "Pie chart"}
                    style={{ display: 'block' }}
                >
                    <g transform={`translate(${resolvedMargin.left + innerWidth / 2}, ${resolvedMargin.top + innerHeight / 2})`}>
                        {pieData.map((datum: PieArcDatum<PieChartDatum>, index:number) => {
                            const path = mainArc(datum);
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
                                <g key={datum.data.id ?? `${datum.data.label}-${index}`}>
                                    <path
                                        d={path}
                                        fill={fill}
                                        stroke="#ffffff"
                                        strokeWidth={1}
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
                                                style={{ fontSize: '12px', fontWeight: 'bold' }}
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
            </div>
			{showLegend && legendItems.length > 0 && (
				<div className="dl2-pie-chart-legend" style={{ marginTop: '10px' }}>
                    <div 
                        className="dl2-pie-chart-legend-header" 
                        onClick={() => setIsLegendCollapsed(!isLegendCollapsed)}
                        style={{ 
                            cursor: 'pointer', 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            paddingBottom: '5px', 
                            borderBottom: isLegendCollapsed ? 'none' : '1px solid #ccc' 
                        }}
                    >
					    <div className="dl2-pie-chart-legend-title" style={{ fontWeight: 'bold' }}>{legendTitle || 'Legend'}</div>
                        <span style={{ fontSize: '0.8em' }}>{isLegendCollapsed ? '▼' : '▲'}</span>
                    </div>
                    
                    {!isLegendCollapsed && (
                        <table className="dl2-pie-chart-legend-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid #eee', color: '#666' }}>
                                    <th style={{ textAlign: 'left', padding: '4px' }}>Category</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>Value</th>
                                    <th style={{ textAlign: 'right', padding: '4px' }}>%</th>
                                </tr>
                            </thead>
                            <tbody>
                                {legendItems.map((item:any) => (
                                    <tr key={item.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                        <td style={{ padding: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <span
                                                    className="dl2-pie-chart-legend-swatch"
                                                    style={{ 
                                                        backgroundColor: item.fill,
                                                        width: '10px',
                                                        height: '10px',
                                                        display: 'inline-block',
                                                        marginRight: '8px',
                                                        borderRadius: '50%'
                                                    }}
                                                />
                                                <span className="dl2-pie-chart-legend-label">{item.label}</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '4px' }}>{item.value.toLocaleString()}</td>
                                        <td style={{ textAlign: 'right', padding: '4px' }}>{item.percentage.toFixed(1)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
				</div>
			)}
		</div>
	);
};

