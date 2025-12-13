import React from "react";
import type { AxisVisualElement as AxisVisualElementType } from "@/types";

export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};

export interface AxisVisualElementProps {
    element: AxisVisualElementType;
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<any>;
    yScale: ScaleLike<any>;
    labelOffset?: number;
}

const dashArray = (style: AxisVisualElementType["lineStyle"]): string | undefined => {
    if (style === "dashed") return "6 4";
    if (style === "dotted") return "2 4";
    return undefined;
};

const isBandScale = (scale: any): scale is { bandwidth: () => number } => {
    return typeof scale?.bandwidth === "function";
};

const centerOnBand = (scale: any, v: any): number => {
    const x = scale(v);
    if (!Number.isFinite(x)) return x;
    return isBandScale(scale) ? x + scale.bandwidth() / 2 : x;
};

export const AxisVisualElement: React.FC<AxisVisualElementProps> = ({
    element,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    labelOffset = 6,
}) => {
    const stroke = element.color ?? "currentColor";
    const strokeWidth = element.lineWidth ?? 1;

    if (element.visualElementType === "xAxis") {
        const y = element.value != null ? yScale(element.value as any) : innerHeight;
        if (!Number.isFinite(y)) return null;

        return (
            <g className="dl2-rve-axis" aria-label={element.label ?? "xAxis"}>
                <line
                    x1={0}
                    y1={y}
                    x2={innerWidth}
                    y2={y}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    strokeDasharray={dashArray(element.lineStyle)}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="none"
                />
                {element.label && (
                    <text
                        x={innerWidth}
                        y={y - labelOffset}
                        textAnchor="end"
                        fontSize={11}
                        fill={stroke}
                    >
                        {element.label}
                    </text>
                )}
            </g>
        );
    }

    const x = element.value != null ? centerOnBand(xScale, element.value as any) : 0;
    if (!Number.isFinite(x)) return null;

    return (
        <g className="dl2-rve-axis" aria-label={element.label ?? "yAxis"}>
            <line
                x1={x}
                y1={0}
                x2={x}
                y2={innerHeight}
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray(element.lineStyle)}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
            {element.label && (
                <text
                    x={x + labelOffset}
                    y={0 + 12}
                    textAnchor="start"
                    fontSize={11}
                    fill={stroke}
                >
                    {element.label}
                </text>
            )}
        </g>
    );
};
