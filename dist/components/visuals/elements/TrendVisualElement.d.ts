import React from "react";
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
export declare const TrendVisualElement: React.FC<TrendVisualElementProps>;
