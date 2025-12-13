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
    /** Required for trend lines. For numeric x-scales you can pass `xScale.domain()` */
    xDomain?: [number, number];
    /** Default interpretation for marker/label values */
    defaultValueAxis?: "x" | "y";
}
export declare const ReportVisualElementsLayer: React.FC<ReportVisualElementsLayerProps>;
