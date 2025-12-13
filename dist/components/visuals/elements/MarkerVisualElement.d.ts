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
    axis?: "x" | "y";
}
export declare const MarkerVisualElement: React.FC<MarkerVisualElementProps>;
