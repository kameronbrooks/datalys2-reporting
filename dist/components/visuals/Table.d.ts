import React from "react";
import type { ReportVisual, AggregateColumn } from "../../lib/types";
export interface TableProps extends ReportVisual {
    columns?: string[];
    pageSize?: number;
    tableStyle?: 'plain' | 'bordered' | 'alternating';
    showSearch?: boolean;
    title?: string;
    /** Enable click-to-sort on headers. Default true. */
    sortable?: boolean;
    /** Initial sort keys (multi-sort priority order). */
    defaultSort?: {
        column: string;
        direction: 'asc' | 'desc';
    }[];
    /** Columns hidden initially (user can re-show via the Columns menu). */
    hiddenColumns?: string[];
    /** Allow the user to hide/show columns at runtime. Default true. */
    allowColumnHiding?: boolean;
    /** Group rows by this column initially. */
    groupBy?: string;
    /** Aggregates shown in each group header row. */
    groupAggregates?: AggregateColumn[];
    /** Start with all groups collapsed. Default false. */
    groupsCollapsed?: boolean;
    /** Show the Export button / menu entries. Default true. */
    enableExport?: boolean;
    /** File name for CSV export. Default: title or datasetId. */
    exportFileName?: string;
    /** Enable the right-click context menu. Default true. */
    contextMenu?: boolean;
    /** Max body height in px; enables scrolling with a sticky header. */
    maxHeight?: number;
    /** Sticky header. Defaults to true when maxHeight is set. */
    stickyHeader?: boolean;
}
export declare const Table: React.FC<TableProps>;
