import React from "react";
import type { AxisVisualElement as AxisVisualElementType } from "@/types";
export type ScaleLike<T = any> = ((value: T) => number) & {
    domain?: () => any[];
    bandwidth?: () => number;
};
export interface AxisVisualElementProps {
    element: AxisVisualElementType;
    innerWidth: number;
    innerHeight: number;
    xScale: ScaleLike<any>;
    yScale: ScaleLike<any>;
    labelOffset?: number;
}
export declare const AxisVisualElement: React.FC<AxisVisualElementProps>;
