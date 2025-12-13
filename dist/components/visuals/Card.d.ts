import React from "react";
import { ReportVisual } from "../../lib/types";
import { type TemplateValue } from "../../lib/template-utility";
export interface CardProps extends ReportVisual {
    text: TemplateValue;
    title?: TemplateValue;
}
export declare const Card: React.FC<CardProps>;
