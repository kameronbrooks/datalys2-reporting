import React from "react";
import type { ReportVisual } from "../../lib/types";
import { ColumnFormatsProp } from "../../lib/format-utility";
import { ConditionalFormat } from "../../lib/conditional-format-utility";
/**
 * Task status, in urgency order (most urgent first). The checklist is
 * read-only by design: status always comes from the dataset, never from
 * user interaction.
 */
export type ChecklistStatus = 'overdue' | 'warning' | 'pending' | 'complete';
/**
 * Props for the Checklist component.
 */
export interface ChecklistProps extends ReportVisual {
    /** Optional list of columns to display. If not provided, all columns except statusColumn are shown. */
    columns?: string[];
    /** The column that indicates whether a task is complete (truthy value). */
    statusColumn: string;
    /** Optional column containing a due date for status calculation. */
    warningColumn?: string;
    /** Number of days before the due date to trigger a 'warning' status. Defaults to 3. */
    warningThreshold?: number;
    /** Optional title for the checklist. */
    title?: string;
    /** Number of items per page. Defaults to 10. */
    pageSize?: number;
    /** Whether to show the search input. Defaults to true. */
    showSearch?: boolean;
    /** Enable click-to-sort on headers. Default true. */
    sortable?: boolean;
    /**
     * Initial sort keys (multi-sort priority order). Use column "status" to
     * sort by urgency. Defaults to urgency, then due date.
     */
    defaultSort?: {
        column: string;
        direction: 'asc' | 'desc';
    }[];
    /** Columns hidden initially (user can re-show via the Columns menu). */
    hiddenColumns?: string[];
    /** Allow the user to hide/show columns at runtime. Default true. */
    allowColumnHiding?: boolean;
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
    /** Allow opening a row (double-click or context menu) in a detail modal. */
    rowModal?: boolean;
    /** Open rows in a custom modal (from `modals`) instead. Implies `rowModal`. */
    rowModalId?: string;
    /** Columns shown in the DEFAULT row detail modal (may include hidden ones). */
    rowModalColumns?: string[];
    /** Title of the default row detail modal. Default: "Details". */
    rowModalTitle?: string;
    /** Persist runtime view changes in the browser. Default true when an `id` is present. */
    persistState?: boolean;
    /** Per-column display formats (same shape as the table's columnFormats). */
    columnFormats?: ColumnFormatsProp;
    /** Cell/row highlight rules (same shape as the table's conditionalFormats). */
    conditionalFormats?: ConditionalFormat[];
    /** Show the status filter chips (All / Pending / Due Soon / Overdue / Complete). Default true. */
    showStatusFilter?: boolean;
    /** Show the completion progress bar. Default true. */
    showProgress?: boolean;
    /** Start with completed tasks hidden (the Complete chip toggled off). Default false. */
    hideCompleted?: boolean;
}
/**
 * Checklist Component
 * Displays a read-only list of tasks with status indicators (complete,
 * pending, warning, overdue) derived from the dataset. Supports status
 * filter chips, a progress bar, urgency-aware sorting, column hiding,
 * search, pagination, CSV export, row detail modals, per-column and
 * conditional formatting, and persistent view state.
 */
export declare const Checklist: React.FC<ChecklistProps>;
