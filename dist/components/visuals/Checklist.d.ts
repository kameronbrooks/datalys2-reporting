import React from "react";
import type { ReportVisual } from "../../lib/types";
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
}
/**
 * Checklist Component
 * Displays a list of tasks with status indicators (complete, pending, warning, overdue).
 * Supports searching, sorting, and pagination.
 */
export declare const Checklist: React.FC<ChecklistProps>;
