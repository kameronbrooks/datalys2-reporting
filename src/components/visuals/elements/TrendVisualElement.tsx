import React, { useMemo } from "react";
import type { TrendVisualElement as TrendVisualElementType } from "@/types";

export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};

export interface TrendVisualElementProps {
    element: TrendVisualElementType;
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<number>;
    yScale: ScaleLike<number>;
    xDomain: [number, number];
    samples?: number;
}

const dashArray = (style: TrendVisualElementType["lineStyle"]): string | undefined => {
    if (style === "dashed") return "6 4";
    if (style === "dotted") return "2 4";
    return undefined;
};

const polyY = (x: number, coefficients: number[]): number => {
    // y = c0 + c1*x + c2*x^2 + ...
    let y = 0;
    let pow = 1;
    for (let i = 0; i < coefficients.length; i++) {
        y += coefficients[i] * pow;
        pow *= x;
    }
    return y;
};

export const TrendVisualElement: React.FC<TrendVisualElementProps> = ({
    element,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    xDomain,
    samples = 80,
}) => {
    const d = useMemo(() => {
        const [xMin, xMax] = xDomain;
        const n = Math.max(2, samples);

        const points: Array<[number, number]> = [];
        for (let i = 0; i < n; i++) {
            const t = i / (n - 1);
            const x = xMin + (xMax - xMin) * t;
            const y = polyY(x, element.coefficients);
            const px = xScale(x);
            const py = yScale(y);
            if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
            // Keep in chart bounds (avoids giant paths if scales return NaN-ish values)
            if (px < -10 || px > innerWidth + 10 || py < -10 || py > innerHeight + 10) {
                points.push([px, py]);
            } else {
                points.push([px, py]);
            }
        }

        if (points.length === 0) return "";
        return `M ${points.map(([x, y]) => `${x} ${y}`).join(" L ")}`;
    }, [element.coefficients, innerHeight, innerWidth, samples, xDomain, xScale, yScale]);

    if (!d) return null;

    const stroke = element.color ?? "currentColor";
    const strokeWidth = element.lineWidth ?? 2;

    return (
        <g className="dl2-rve-trend" aria-label={element.label ?? "trend"}>
            <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray(element.lineStyle)}
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
        </g>
    );
};
