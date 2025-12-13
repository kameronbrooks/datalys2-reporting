import React from "react";
import type { MarkerVisualElement as MarkerVisualElementType } from "@/types";

export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};

export interface MarkerVisualElementProps {
    element: MarkerVisualElementType;
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<any>;
    yScale: ScaleLike<any>;
    axis?: "x" | "y"; // how to interpret element.value
}

const dashArray = (style: MarkerVisualElementType["lineStyle"] | undefined): string | undefined => {
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

export const MarkerVisualElement: React.FC<MarkerVisualElementProps> = ({
    element,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    axis = "y",
}) => {
    const stroke = element.color ?? "currentColor";
    const strokeWidth = element.lineWidth ?? 1;
    const size = element.size ?? 8;
    const half = size / 2;

    if (axis === "x") {
        const x = centerOnBand(xScale, element.value as any);
        if (!Number.isFinite(x)) return null;

        return (
            <g className="dl2-rve-marker" aria-label={element.label ?? "marker"}>
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
                {/* marker symbol at top edge */}
                {element.shape === "square" ? (
                    <rect x={x - half} y={0} width={size} height={size} fill={stroke} pointerEvents="none" />
                ) : element.shape === "triangle" ? (
                    <path
                        d={`M ${x} ${0} L ${x - half} ${size} L ${x + half} ${size} Z`}
                        fill={stroke}
                        pointerEvents="none"
                    />
                ) : (
                    <circle cx={x} cy={half} r={half} fill={stroke} pointerEvents="none" />
                )}
            </g>
        );
    }

    const y = yScale(element.value as any);
    if (!Number.isFinite(y)) return null;

    return (
        <g className="dl2-rve-marker" aria-label={element.label ?? "marker"}>
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
            {/* marker symbol at left edge */}
            {element.shape === "square" ? (
                <rect x={0} y={y - half} width={size} height={size} fill={stroke} pointerEvents="none" />
            ) : element.shape === "triangle" ? (
                <path
                    d={`M ${0} ${y} L ${size} ${y - half} L ${size} ${y + half} Z`}
                    fill={stroke}
                    pointerEvents="none"
                />
            ) : (
                <circle cx={half} cy={y} r={half} fill={stroke} pointerEvents="none" />
            )}
        </g>
    );
};
