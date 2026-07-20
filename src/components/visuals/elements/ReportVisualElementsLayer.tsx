import React from "react";
import type {
    AxisVisualElement as AxisVisualElementType,
    LabelVisualElement as LabelVisualElementType,
    MarkerVisualElement as MarkerVisualElementType,
    ReportVisualElement,
    TrendVisualElement as TrendVisualElementType,
} from "@/types";
import { AxisVisualElement } from "./AxisVisualElement";
import { LabelVisualElement } from "./LabelVisualElement";
import { MarkerVisualElement } from "./MarkerVisualElement";
import { TrendVisualElement } from "./TrendVisualElement";

export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};

export interface ReportVisualElementsLayerProps {
    elements?: ReportVisualElement[];
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<any>;
    yScale: ScaleLike<any>;
    /**
     * Numeric x-domain used to sample trend lines. Optional: when omitted it
     * is derived from the scale — numeric scales use their own domain, and
     * band/point (categorical) scales evaluate the trend against the 0-based
     * category index.
     */
    xDomain?: [number, number];
    /** Default interpretation for marker/label values */
    defaultValueAxis?: "x" | "y";
}

const isBandScale = (scale: any): boolean => typeof scale?.bandwidth === "function";

/**
 * Resolves the numeric domain and sampling scale for a trend line.
 * Band/point scales get an index-based mapping (x = 0-based category index,
 * interpolated between band centers); numeric scales use their own domain.
 */
const resolveTrendScale = (
    xScale: ScaleLike<any>,
    xDomain?: [number, number]
): { domain: [number, number]; scale: (x: number) => number } | null => {
    if (xDomain) return { domain: xDomain, scale: xScale as (x: number) => number };

    const dom = typeof xScale.domain === "function" ? xScale.domain() : undefined;
    if (!dom || dom.length === 0) return null;

    if (isBandScale(xScale)) {
        const center = (xScale.bandwidth?.() ?? 0) / 2;
        const clamp = (i: number) => Math.min(Math.max(i, 0), dom.length - 1);
        return {
            domain: [0, Math.max(dom.length - 1, 1)],
            scale: (x: number) => {
                const i0 = clamp(Math.floor(x));
                const i1 = clamp(i0 + 1);
                const p0 = (xScale as any)(dom[i0]) + center;
                const p1 = (xScale as any)(dom[i1]) + center;
                const frac = x - i0;
                return i1 === i0 ? p0 : p0 + (p1 - p0) * frac;
            },
        };
    }

    const first = dom[0];
    const last = dom[dom.length - 1];
    if (typeof first === "number" && typeof last === "number") {
        return { domain: [first, last], scale: xScale as (x: number) => number };
    }
    return null;
};

const inferValueAxis = (
    value: unknown,
    xScale: ScaleLike<any>,
    yScale: ScaleLike<any>,
    fallback: "x" | "y"
): "x" | "y" => {
    // Strings usually map to band/categorical x scales.
    if (typeof value === "string") return "x";
    if (value instanceof Date) return "x";

    // If x is band scale, prefer x for strings (handled above) otherwise y.
    if (isBandScale(xScale)) return fallback;

    // For numeric x/y scales, marker/label is ambiguous; default to fallback.
    return fallback;
};

export const ReportVisualElementsLayer: React.FC<ReportVisualElementsLayerProps> = ({
    elements,
    innerWidth,
    innerHeight,
    xScale,
    yScale,
    xDomain,
    defaultValueAxis = "y",
}) => {
    if (!elements || elements.length === 0) return null;

    return (
        <g className="dl2-rve-layer">
            {elements.map((el, idx) => {
                switch (el.visualElementType) {
                    case "trend": {
                        const t = el as TrendVisualElementType;
                        const trend = resolveTrendScale(xScale, xDomain);
                        if (!trend) return null;
                        return (
                            <TrendVisualElement
                                key={`trend-${idx}`}
                                element={t}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                                xScale={trend.scale as any}
                                yScale={yScale as any}
                                xDomain={trend.domain}
                            />
                        );
                    }
                    case "xAxis":
                    case "yAxis": {
                        const a = el as AxisVisualElementType;
                        return (
                            <AxisVisualElement
                                key={`axis-${idx}`}
                                element={a}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                                xScale={xScale}
                                yScale={yScale}
                            />
                        );
                    }
                    case "marker": {
                        const m = el as MarkerVisualElementType;
                        const axis = inferValueAxis(m.value, xScale, yScale, defaultValueAxis);
                        return (
                            <MarkerVisualElement
                                key={`marker-${idx}`}
                                element={m}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                                xScale={xScale}
                                yScale={yScale}
                                axis={axis}
                            />
                        );
                    }
                    case "label": {
                        const l = el as LabelVisualElementType;
                        const axis = inferValueAxis(l.value, xScale, yScale, defaultValueAxis);
                        return (
                            <LabelVisualElement
                                key={`label-${idx}`}
                                element={l}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                                xScale={xScale}
                                yScale={yScale}
                                axis={axis}
                            />
                        );
                    }
                    default:
                        return null;
                }
            })}
        </g>
    );
};
