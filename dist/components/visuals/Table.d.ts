import React from "react";
import type { ReportVisual, AggregateColumn, AggFn } from "../../lib/types";
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
    /**
     * Grand-total row at the bottom (computed over the filtered data, all
     * pages). `true` sums every numeric column; or pass `{ label, fns }`
     * with per-column aggregate fns, e.g. { "fns": { "amount": "sum", "units": "avg" } }.
     */
    totalRow?: boolean | {
        label?: string;
        fns?: Record<string, AggFn>;
    };
    /**
     * Per-row total column appended on the right. `true` sums every numeric
     * visible column; or pass `{ label, columns }` to control which columns
     * are summed.
     */
    totalColumn?: boolean | {
        label?: string;
        columns?: string[];
    };
}
export declare const Table: React.FC<TableProps>;
