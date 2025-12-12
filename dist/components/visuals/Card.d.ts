import React from "react";
import { ReportVisual } from "../../lib/types";
export interface CardProps extends ReportVisual {
    text: string;
    title?: string;
}
export declare const Card: React.FC<CardProps>;
