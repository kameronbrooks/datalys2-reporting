import React from "react";
import type { ReportVisual } from "../../lib/types";
export interface ChecklistProps extends ReportVisual {
    columns?: string[];
    statusColumn: string;
    warningColumn?: string;
    warningThreshold?: number;
    title?: string;
    pageSize?: number;
    showSearch?: boolean;
}
export declare const Checklist: React.FC<ChecklistProps>;
