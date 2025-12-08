import React, { useMemo } from "react";
import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import { arc, pie, scaleOrdinal, schemeTableau10 } from "d3";
import type { PieArcDatum } from "d3";
import type { ReportVisual } from "../../lib/types";

export interface PieChartDatum {
	id?: string;
	label: string;
	value: number;
	color?: string;
}

export interface PieChartProps extends ReportVisual {
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

const defaultMargin = { top: 16, right: 16, bottom: 16, left: 16 };

export const PieChart: React.FC<PieChartProps> = ({
    datasetId,
	title,
	description,
	padding,
	margin,
	border,
	shadow,
	width = 320,
	height = 240,
	innerRadius = 0,
	cornerRadius = 4,
	padAngle = 0.015,
	chartMargin,
	colors,
	showLegend = true,
	legendTitle
}) => {

    const generatePieChartDatum = (table: any[]): PieChartDatum[] => {
        return table.map((row) => ({
            label: String(row[0]),
            value: Number(row[1])
        }));
    }

    const ctx = useContext(AppContext) || {datasets: {}};
    const data = generatePieChartDatum(ctx.datasets[datasetId]?.data || []) as PieChartDatum[];

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

	const innerWidth = Math.max(0, width - resolvedMargin.left - resolvedMargin.right);
	const innerHeight = Math.max(0, height - resolvedMargin.top - resolvedMargin.bottom);
	const radius = Math.max(0, Math.min(innerWidth, innerHeight) / 2);
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
			.innerRadius(radius * 0.6)
			.outerRadius(radius),
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
		padding,
		margin,
		border,
		boxShadow: shadow
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

	if (!sanitizedData.length || radius === 0) {
		return (
			<div className="dl2-pie-chart" style={containerStyle}>
				{title && <h3 className="dl2-pie-chart-title">{title}</h3>}
				{description && <p className="dl2-pie-chart-description">{description}</p>}
				<div className="dl2-pie-chart-empty">No data available.</div>
			</div>
		);
	}

	return (
		<div className="dl2-pie-chart" style={containerStyle}>
			{title && <h3 className="dl2-pie-chart-title">{title}</h3>}
			{description && <p className="dl2-pie-chart-description">{description}</p>}

			<svg
				className="dl2-pie-chart-svg"
				width={width}
				height={height}
				role="img"
				aria-label={title ?? "Pie chart"}
			>
				<g transform={`translate(${resolvedMargin.left + innerWidth / 2}, ${resolvedMargin.top + innerHeight / 2})`}>
					{pieData.map((datum: PieArcDatum<PieChartDatum>, index:number) => {
						const path = mainArc(datum);
						if (!path) {
							return null;
						}

						const [labelX, labelY] = labelArc.centroid(datum);
						const fill = datum.data.color ?? colorScale(datum.data.label);
						const shouldShowLabel = totalValue > 0 ? datum.value / totalValue >= 0.07 : false;

						return (
							<g key={datum.data.id ?? `${datum.data.label}-${index}`}>
								<path
									d={path}
									fill={fill}
									stroke="#ffffff"
									strokeWidth={1}
								/>
								{shouldShowLabel && (
									<text
										x={labelX}
										y={labelY}
										textAnchor="middle"
										dominantBaseline="middle"
										className="dl2-pie-chart-label"
									>
										{datum.data.label}
									</text>
								)}
							</g>
						);
					})}
				</g>
			</svg>

			{showLegend && legendItems.length > 0 && (
				<div className="dl2-pie-chart-legend">
					{legendTitle && <div className="dl2-pie-chart-legend-title">{legendTitle}</div>}
					<ul className="dl2-pie-chart-legend-list">
						{legendItems.map((item:any) => (
							<li key={item.key} className="dl2-pie-chart-legend-item">
								<span
									className="dl2-pie-chart-legend-swatch"
									style={{ backgroundColor: item.fill }}
								/>
								<span className="dl2-pie-chart-legend-label">{item.label}</span>
								<span className="dl2-pie-chart-legend-value">
									{item.value.toLocaleString()} ({item.percentage.toFixed(1)}%)
								</span>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

