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
    axis?: "x" | "y";
    offset?: number;
}
export declare const LabelVisualElement: React.FC<LabelVisualElementProps>;
