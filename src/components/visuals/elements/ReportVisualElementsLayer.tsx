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
    /** Required for trend lines. For numeric x-scales you can pass `xScale.domain()` */
    xDomain?: [number, number];
    /** Default interpretation for marker/label values */
    defaultValueAxis?: "x" | "y";
}

const isBandScale = (scale: any): boolean => typeof scale?.bandwidth === "function";

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
                        if (!xDomain) return null;
                        return (
                            <TrendVisualElement
                                key={`trend-${idx}`}
                                element={t}
                                innerWidth={innerWidth}
                                innerHeight={innerHeight}
                                xScale={xScale as any}
                                yScale={yScale as any}
                                xDomain={xDomain}
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
