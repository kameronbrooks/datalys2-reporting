import React from "react";
import type { ReportVisual } from "../../lib/types";
export interface TableProps extends ReportVisual {
    columns?: string[];
    pageSize?: number;
    tableStyle?: 'plain' | 'bordered' | 'alternating';
    showSearch?: boolean;
    title?: string;
}
export declare const Table: React.FC<TableProps>;
