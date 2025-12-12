import React from "react";
export interface VisualLegendItem {
    key: string;
    label: string;
    value: number;
    percentage: number;
    fill: string;
}
export interface VisualLegendProps {
    title?: string;
    items: VisualLegendItem[];
}
export declare const VisualLegend: React.FC<VisualLegendProps>;
