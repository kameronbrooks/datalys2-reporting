import React from "react";
import type { ReportVisualElement } from "@/types";
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
export declare const ReportVisualElementsLayer: React.FC<ReportVisualElementsLayerProps>;
