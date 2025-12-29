import React from "react";
import type { ReportVisual } from "../../lib/types";
export interface KPIProps extends ReportVisual {
    valueColumn?: string | number;
    comparisonColumn?: string | number;
    rowIndex?: number;
    format?: 'number' | 'currency' | 'percent' | 'date';
    currencySymbol?: string;
    goodDirection?: 'higher' | 'lower';
    breachValue?: number;
    warningValue?: number;
    title?: string;
    width?: number;
    height?: number;
}
export declare const KPI: React.FC<KPIProps>;
