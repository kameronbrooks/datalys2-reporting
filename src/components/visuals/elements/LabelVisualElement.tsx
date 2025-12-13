import React from "react";
import type { LabelVisualElement as LabelVisualElementType } from "@/types";

export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};

export interface LabelVisualElementProps {
    element: LabelVisualElementType;
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<any>;
    yScale: ScaleLike<any>;
    axis?: "x" | "y"; // how to interpret element.value
    offset?: number;
}

const isBandScale = (scale: any): scale is { bandwidth: () => number } => {
    return typeof scale?.bandwidth === "function";
};

const centerOnBand = (scale: any, v: any): number => {
    const x = scale(v);
    if (!Number.isFinite(x)) return x;
    return isBandScale(scale) ? x + scale.bandwidth() / 2 : x;
};

export const LabelVisualElement: React.FC<LabelVisualElementProps> = ({
    element,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    axis = "y",
    offset = 6,
}) => {
    const fill = element.color ?? "currentColor";
    const fontSize = element.fontSize ?? 12;
    const fontWeight = element.fontWeight ?? "normal";

    const text = element.label ?? String(element.value);

    if (axis === "x") {
        const x = centerOnBand(xScale, element.value as any);
        if (!Number.isFinite(x)) return null;
        return (
            <g className="dl2-rve-label" aria-label="label">
                <text
                    x={x}
                    y={innerHeight - offset}
                    textAnchor="middle"
                    fontSize={fontSize}
                    fontWeight={fontWeight}
                    fill={fill}
                    pointerEvents="none"
                >
                    {text}
                </text>
            </g>
        );
    }

    const y = yScale(element.value as any);
    if (!Number.isFinite(y)) return null;

    return (
        <g className="dl2-rve-label" aria-label="label">
            <text
                x={0 + offset}
                y={y - offset}
                textAnchor="start"
                dominantBaseline="auto"
                fontSize={fontSize}
                fontWeight={fontWeight}
                fill={fill}
                pointerEvents="none"
            >
                {text}
            </text>
        </g>
    );
};
