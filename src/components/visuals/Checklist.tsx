import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual } from "../../lib/types";
import { isDate, printDate } from "../../lib/date-utility";
import { multiSort, SortKey } from "../../lib/sort-utility";
import { loadVisualState, saveVisualState, clearVisualState } from "../../lib/state-persistence";
import { toCSV, toTSV, downloadCSV, copyTextToClipboard } from "../../lib/export-utility";
import { formatValue, resolveColumnFormats, ColumnFormatsProp } from "../../lib/format-utility";
import { ConditionalFormat, evaluateConditionalFormats } from "../../lib/conditional-format-utility";
import { toRecords } from "../../lib/dataset-utility";
import { ContextMenu, ContextMenuItem } from "../ContextMenu";
import { VisualContainer } from "./VisualContainer";

/**
 * Task status, in urgency order (most urgent first). The checklist is
 * read-only by design: status always comes from the dataset, never from
 * user interaction.
 */
export type ChecklistStatus = 'overdue' | 'warning' | 'pending' | 'complete';

/** Urgency order used for status sorting: overdue < warning < pending < complete. */
const STATUS_ORDER: ChecklistStatus[] = ['overdue', 'warning', 'pending', 'complete'];
const STATUS_RANK: Record<ChecklistStatus, number> = { overdue: 0, warning: 1, pending: 2, complete: 3 };
const STATUS_LABELS: Record<ChecklistStatus, string> = {
    overdue: 'Overdue',
    warning: 'Due Soon',
    pending: 'Pending',
    complete: 'Complete'
};

/** Internal pseudo-column holding the status urgency rank (sortable via multiSort). */
const STATUS_KEY = '__dl2_status';

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
    defaultSort?: { column: string; direction: 'asc' | 'desc' }[];
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

/** The slice of checklist view state that persists across reloads. */
interface PersistedChecklistState {
    sortKeys?: SortKey[];
    hiddenCols?: string[];
    hiddenStatuses?: ChecklistStatus[];
}

interface MenuState {
    position: { x: number; y: number };
    items: ContextMenuItem[];
}

/**
 * Checklist Component
 * Displays a read-only list of tasks with status indicators (complete,
 * pending, warning, overdue) derived from the dataset. Supports status
 * filter chips, a progress bar, urgency-aware sorting, column hiding,
 * search, pagination, CSV export, row detail modals, per-column and
 * conditional formatting, and persistent view state.
 */
export const Checklist: React.FC<ChecklistProps> = ({
    datasetId,
    columns,
    statusColumn,
    warningColumn,
    warningThreshold = 3,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
    pageSize = 10,
    showSearch = true,
    sortable = true,
    defaultSort,
    hiddenColumns: initialHiddenColumns,
    allowColumnHiding = true,
    enableExport = true,
    exportFileName,
    contextMenu = true,
    maxHeight,
    stickyHeader,
    rowModal,
    rowModalId,
    rowModalColumns,
    rowModalTitle,
    persistState,
    columnFormats,
    conditionalFormats,
    showStatusFilter = true,
    showProgress = true,
    hideCompleted = false,
    id
}) => {
    const ctx = useContext(AppContext);
    const dataset = ctx.datasets[datasetId];
    const rowOpenEnabled = rowModal === true || !!rowModalId;

    /** Maps a defaultSort column name onto the internal sort key ("status" → urgency rank). */
    const toSortKey = (column: string): string =>
        column.toLowerCase() === 'status' ? STATUS_KEY : column;

    const configDefaultSort = (): SortKey[] => {
        if (defaultSort && defaultSort.length > 0) {
            return defaultSort.map(s => ({ key: toSortKey(s.column), direction: s.direction }));
        }
        // Urgency first (overdue → due soon → pending → complete), then due date.
        const keys: SortKey[] = [{ key: STATUS_KEY, direction: 'asc' }];
        if (warningColumn) keys.push({ key: warningColumn, direction: 'asc' });
        return keys;
    };
    const configHiddenStatuses = (): ChecklistStatus[] => hideCompleted ? ['complete'] : [];

    // View-state persistence: on by default when the visual has an id.
    const persistenceEnabled = (persistState ?? true) && !!id;
    const savedState = useMemo<PersistedChecklistState | null>(
        () => persistenceEnabled ? loadVisualState<PersistedChecklistState>(id!) : null,
        // Load once per mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKeys, setSortKeys] = useState<SortKey[]>(() => savedState?.sortKeys ?? configDefaultSort());
    const [hiddenCols, setHiddenCols] = useState<string[]>(
        () => savedState?.hiddenCols ?? (initialHiddenColumns || [])
    );
    const [hiddenStatuses, setHiddenStatuses] = useState<ChecklistStatus[]>(
        () => savedState?.hiddenStatuses ?? configHiddenStatuses()
    );
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [detailRow, setDetailRow] = useState<any | null>(null);

    const useStickyHeader = stickyHeader ?? (maxHeight !== undefined);
    const colFormats = useMemo(() => resolveColumnFormats(columnFormats), [columnFormats]);

    // Save view state on change (skipping the initial render so untouched
    // checklists leave no storage entries behind).
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        if (!persistenceEnabled) return;
        saveVisualState(id!, { sortKeys, hiddenCols, hiddenStatuses } satisfies PersistedChecklistState);
    }, [persistenceEnabled, id, sortKeys, hiddenCols, hiddenStatuses]);

    /** Clears saved state and restores the config-defined defaults. */
    const resetViewState = () => {
        if (persistenceEnabled) clearVisualState(id!);
        setSortKeys(configDefaultSort());
        setHiddenCols(initialHiddenColumns || []);
        setHiddenStatuses(configHiddenStatuses());
        setSearchTerm("");
        setCurrentPage(1);
    };

    /**
     * Normalized records augmented with the status urgency rank under an
     * internal pseudo-column, so the standard multiSort can sort by status.
     */
    const augmentedData = useMemo(() => {
        const now = new Date();
        const getRowStatus = (row: any): ChecklistStatus => {
            if (row[statusColumn]) return 'complete';
            if (warningColumn && row[warningColumn]) {
                const dueDate = isDate(row[warningColumn]) ? row[warningColumn] : new Date(row[warningColumn]);
                const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) return 'overdue';
                if (diffDays <= warningThreshold) return 'warning';
            }
            return 'pending';
        };
        return toRecords(dataset).map(row => ({ ...row, [STATUS_KEY]: STATUS_RANK[getRowStatus(row)] } as Record<string, any>));
    }, [dataset, statusColumn, warningColumn, warningThreshold]);

    const statusOf = (row: any): ChecklistStatus => STATUS_ORDER.find(s => STATUS_RANK[s] === row[STATUS_KEY]) || 'pending';

    /** Statuses that can actually occur (warning/overdue need a due-date column). */
    const possibleStatuses: ChecklistStatus[] = warningColumn
        ? ['pending', 'warning', 'overdue', 'complete']
        : ['pending', 'complete'];

    // Determine which columns the checklist could display (before hiding)
    const allColumns = useMemo(() => {
        if (columns && columns.length > 0) return columns;
        if (dataset && dataset.columns) return dataset.columns.filter(c => c !== statusColumn);
        if (augmentedData.length > 0) return Object.keys(augmentedData[0]).filter(c => c !== statusColumn && c !== STATUS_KEY);
        return [];
    }, [columns, dataset, augmentedData, statusColumn]);

    const displayColumns = useMemo(
        () => allColumns.filter(col => !hiddenCols.includes(col)),
        [allColumns, hiddenCols]
    );

    const renderCell = (val: any) =>
        val === null || val === undefined ? '' : (isDate(val) ? printDate(val, undefined, true) : String(val));

    /** Cell display text: column format when configured, default rendering otherwise. */
    const cellText = (val: any, col: string) =>
        colFormats[col] ? formatValue(val, colFormats[col]) : renderCell(val);

    /** Search-filtered rows (before the status chips) — the base for counts and progress. */
    const searchedData = useMemo(() => {
        if (!searchTerm) return augmentedData;
        const lowerTerm = searchTerm.toLowerCase();
        return augmentedData.filter(row =>
            displayColumns.some(col => {
                const val = row[col];
                const stringVal = isDate(val) ? printDate(val, undefined, true) : String(val);
                return stringVal.toLowerCase().includes(lowerTerm);
            })
            || STATUS_LABELS[statusOf(row)].toLowerCase().includes(lowerTerm)
        );
    }, [augmentedData, searchTerm, displayColumns]);

    /** Chip-filtered and sorted rows — what the table body shows. */
    const processedData = useMemo(() => {
        const dtypeOf = (col: string): string | undefined => {
            if (col === STATUS_KEY) return 'int';
            if (!dataset || !dataset.columns || !dataset.dtypes) return undefined;
            const index = dataset.columns.indexOf(col);
            return index >= 0 ? dataset.dtypes[index] : undefined;
        };

        let data = hiddenStatuses.length > 0
            ? searchedData.filter(row => !hiddenStatuses.includes(statusOf(row)))
            : searchedData;

        if (sortKeys.length > 0) {
            data = multiSort(data, sortKeys.map(k => ({ ...k, dtype: dtypeOf(k.key) })));
        }
        return data;
    }, [searchedData, hiddenStatuses, sortKeys, dataset]);

    // Progress and chip counts are computed BEFORE the status chips filter,
    // so hiding completed tasks doesn't zero the progress bar.
    const completedCount = useMemo(
        () => searchedData.filter(row => row[STATUS_KEY] === STATUS_RANK.complete).length,
        [searchedData]
    );
    const statusCounts = useMemo(() => {
        const counts: Record<ChecklistStatus, number> = { overdue: 0, warning: 0, pending: 0, complete: 0 };
        searchedData.forEach(row => { counts[statusOf(row)]++; });
        return counts;
    }, [searchedData]);
    const progressPercent = searchedData.length > 0 ? (completedCount / searchedData.length) * 100 : 0;

    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const toggleStatus = (status: ChecklistStatus) => {
        setCurrentPage(1);
        setHiddenStatuses(prev => prev.includes(status)
            ? prev.filter(s => s !== status)
            : [...prev, status]);
    };

    /**
     * Header click: plain click replaces the sort (asc → desc → clear);
     * Shift+click appends/toggles the column as an additional sort key.
     */
    const handleSort = (key: string, additive: boolean) => {
        if (!sortable) return;
        setCurrentPage(1);
        setSortKeys(prev => {
            const existing = prev.find(k => k.key === key);
            if (additive && prev.length > 0) {
                if (!existing) return [...prev, { key, direction: 'asc' }];
                if (existing.direction === 'asc') {
                    return prev.map(k => k.key === key ? { ...k, direction: 'desc' as const } : k);
                }
                return prev.filter(k => k.key !== key);
            }
            if (existing && prev.length === 1) {
                if (existing.direction === 'asc') return [{ key, direction: 'desc' }];
                return [];
            }
            return [{ key, direction: 'asc' }];
        });
    };

    const setSort = (key: string, direction: 'asc' | 'desc') => {
        setSortKeys([{ key, direction }]);
        setCurrentPage(1);
    };

    const hideColumn = (col: string) => {
        setHiddenCols(prev => prev.includes(col) ? prev : [...prev, col]);
    };

    const toggleColumn = (col: string) => {
        setHiddenCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
    };

    /** Removes the internal status pseudo-column from a row. */
    const cleanRow = (row: any) => {
        const { [STATUS_KEY]: _rank, ...rest } = row;
        return rest;
    };

    /** Opens the detail view for a row — custom modal if configured, else the built-in one. */
    const openRowDetails = (row: any) => {
        if (!rowOpenEnabled) return;
        if (rowModalId) {
            ctx.openModal(rowModalId, { row: cleanRow(row), datasetId });
        } else {
            setDetailRow(row);
        }
    };

    // Exports include a derived "Status" column (CSV keeps raw data values;
    // clipboard copy matches the formatted on-screen view).
    const exportColumns = ['Status', ...displayColumns];
    const exportRowsRaw = () => processedData.map(row => ({ Status: STATUS_LABELS[statusOf(row)], ...cleanRow(row) }));
    const exportRowsDisplay = () => processedData.map(row => {
        const display: Record<string, string> = { Status: STATUS_LABELS[statusOf(row)] };
        displayColumns.forEach(col => { display[col] = cellText(row[col], col); });
        return display;
    });

    const doExportCSV = () => {
        downloadCSV(
            exportFileName || title || datasetId || 'checklist',
            toCSV(exportColumns, exportRowsRaw())
        );
    };

    const doCopyTable = () => {
        copyTextToClipboard(toTSV(exportColumns, exportRowsDisplay()));
    };

    /** Builds the context menu for a header cell (statusHeader = the Status column). */
    const openHeaderMenu = (e: React.MouseEvent, col: string, statusHeader: boolean = false) => {
        if (!contextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        const sortCol = statusHeader ? STATUS_KEY : col;
        const items: ContextMenuItem[] = [];
        if (sortable) {
            const current = sortKeys.length === 1 ? sortKeys.find(k => k.key === sortCol) : undefined;
            items.push(
                {
                    label: statusHeader ? 'Sort by urgency' : 'Sort ascending',
                    onClick: () => setSort(sortCol, 'asc'),
                    checked: current?.direction === 'asc'
                },
                {
                    label: statusHeader ? 'Sort by urgency (reversed)' : 'Sort descending',
                    onClick: () => setSort(sortCol, 'desc'),
                    checked: current?.direction === 'desc'
                },
                { label: 'Clear sort', onClick: () => setSortKeys([]), disabled: sortKeys.length === 0 },
                { separator: true }
            );
        }
        if (!statusHeader && allowColumnHiding) {
            items.push({ label: `Hide "${col}"`, onClick: () => hideColumn(col), disabled: displayColumns.length <= 1 });
        }
        if (enableExport) {
            items.push(
                { separator: true },
                { label: 'Export CSV', onClick: doExportCSV },
                { label: 'Copy list to clipboard', onClick: doCopyTable }
            );
        }
        items.push(
            { separator: true },
            { label: 'Reset view', onClick: resetViewState }
        );
        setMenu({ position: { x: e.clientX, y: e.clientY }, items });
    };

    /** Builds the context menu for a body cell. */
    const openCellMenu = (e: React.MouseEvent, row: any, col: string | null) => {
        if (!contextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        const items: ContextMenuItem[] = [];
        if (rowOpenEnabled) {
            items.push(
                { label: 'Open details', onClick: () => openRowDetails(row) },
                { separator: true }
            );
        }
        if (col !== null) {
            items.push({ label: 'Copy cell', onClick: () => copyTextToClipboard(cellText(row[col], col)) });
        }
        items.push({
            label: 'Copy row',
            onClick: () => copyTextToClipboard(
                [STATUS_LABELS[statusOf(row)], ...displayColumns.map(c => cellText(row[c], c))].join('\t')
            )
        });
        if (enableExport) {
            items.push(
                { separator: true },
                { label: 'Export CSV', onClick: doExportCSV }
            );
        }
        setMenu({ position: { x: e.clientX, y: e.clientY }, items });
    };

    /** Opens the Columns visibility menu from the toolbar button. */
    const openColumnsMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenu({
            position: { x: rect.left, y: rect.bottom + 2 },
            items: allColumns.map(col => ({
                label: col,
                checked: !hiddenCols.includes(col),
                disabled: !hiddenCols.includes(col) && displayColumns.length <= 1,
                onClick: () => toggleColumn(col)
            }))
        });
    };

    if (!dataset) {
        return <div style={{ padding: 10, color: 'var(--dl2-error)' }}>Dataset '{datasetId}' not found.</div>;
    }

    const sortIndicator = (col: string) => {
        const index = sortKeys.findIndex(k => k.key === col);
        if (index < 0) return null;
        const key = sortKeys[index];
        return (
            <span style={{ marginLeft: 5 }}>
                {key.direction === 'asc' ? '▲' : '▼'}
                {sortKeys.length > 1 && <sup style={{ fontSize: '0.7em' }}>{index + 1}</sup>}
            </span>
        );
    };

    const thStyle: React.CSSProperties | undefined = useStickyHeader
        ? { position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--dl2-bg-visual)' }
        : undefined;

    const chipLabel: Record<ChecklistStatus, string> = STATUS_LABELS;

    return (
        <VisualContainer
            padding={padding}
            margin={margin}
            border={border}
            shadow={shadow}
            flex={flex}
            title={title}
            description={description}
        >
            {/* Controls: search, Columns, Export */}
            <div className="dl2-table-controls">
                {showSearch && (
                    <input
                        type="text"
                        placeholder="Search tasks..."
                        className="dl2-table-search"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                    />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    {allowColumnHiding && (
                        <button className="dl2-table-toolbar-btn" onClick={openColumnsMenu} title="Show or hide columns">
                            Columns ▾
                        </button>
                    )}
                    {enableExport && (
                        <button className="dl2-table-toolbar-btn" onClick={doExportCSV} title="Download visible data as CSV">
                            Export
                        </button>
                    )}
                    <div style={{ fontSize: '0.9em', color: 'var(--dl2-text-muted)', whiteSpace: 'nowrap' }}>
                        {completedCount} / {searchedData.length} Completed
                    </div>
                </div>
            </div>

            {/* Status chips + progress bar */}
            {(showStatusFilter || showProgress) && (
                <div className="dl2-checklist-filterbar">
                    {showStatusFilter && (
                        <div className="dl2-checklist-chips">
                            <button
                                className={`dl2-checklist-chip${hiddenStatuses.length === 0 ? ' active' : ''}`}
                                title="Show all statuses"
                                onClick={() => { setHiddenStatuses([]); setCurrentPage(1); }}
                            >
                                All ({searchedData.length})
                            </button>
                            {possibleStatuses.map(status => (
                                <button
                                    key={status}
                                    className={`dl2-checklist-chip ${status}${!hiddenStatuses.includes(status) ? ' active' : ''}`}
                                    title={`Click to ${hiddenStatuses.includes(status) ? 'show' : 'hide'} ${chipLabel[status].toLowerCase()} tasks`}
                                    onClick={() => toggleStatus(status)}
                                >
                                    {chipLabel[status]} ({statusCounts[status]})
                                </button>
                            ))}
                        </div>
                    )}
                    {showProgress && (
                        <div className="dl2-checklist-progress" title={`${completedCount} of ${searchedData.length} tasks complete`}>
                            <div className="dl2-checklist-progress-track">
                                <div className="dl2-checklist-progress-fill" style={{ width: `${progressPercent}%` }} />
                            </div>
                            <span className="dl2-checklist-progress-label">{Math.round(progressPercent)}%</span>
                        </div>
                    )}
                </div>
            )}

            <div
                className="dl2-table-container"
                style={maxHeight !== undefined ? { maxHeight, overflow: 'auto' } : undefined}
            >
                <table className="dl2-table dl2-checklist">
                    <thead>
                        <tr>
                            <th
                                style={{ ...thStyle, width: '70px' }}
                                onClick={(e) => handleSort(STATUS_KEY, e.shiftKey)}
                                onContextMenu={(e) => openHeaderMenu(e, 'Status', true)}
                                title={sortable ? 'Click to sort by urgency · Right-click for options' : undefined}
                            >
                                Status
                                {sortIndicator(STATUS_KEY)}
                            </th>
                            {displayColumns.map(col => (
                                <th
                                    key={col}
                                    onClick={(e) => handleSort(col, e.shiftKey)}
                                    onContextMenu={(e) => openHeaderMenu(e, col)}
                                    style={thStyle}
                                    title={sortable ? 'Click to sort · Shift+click for multi-sort · Right-click for options' : undefined}
                                >
                                    {col}
                                    {sortIndicator(col)}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, i) => {
                            const status = statusOf(row);
                            const cf = evaluateConditionalFormats(row, conditionalFormats, dataset);
                            const rowClasses = [
                                'dl2-checklist-row',
                                status,
                                rowOpenEnabled ? 'dl2-table-row--openable' : '',
                                cf?.row?.className || ''
                            ].filter(Boolean).join(' ');
                            return (
                                <tr
                                    key={i}
                                    className={rowClasses}
                                    style={cf?.row?.style as React.CSSProperties | undefined}
                                    onDoubleClick={rowOpenEnabled ? () => openRowDetails(row) : undefined}
                                    title={rowOpenEnabled ? 'Double-click to open details' : undefined}
                                >
                                    <td
                                        style={{ textAlign: 'center' }}
                                        onContextMenu={(e) => openCellMenu(e, row, null)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={status === 'complete'}
                                            readOnly
                                            style={{ cursor: 'default' }}
                                            aria-label={STATUS_LABELS[status]}
                                        />
                                    </td>
                                    {displayColumns.map(col => {
                                        const cellCf = cf?.cells[col];
                                        return (
                                            <td
                                                key={col}
                                                className={[
                                                    col === warningColumn ? 'dl2-checklist-date' : '',
                                                    cellCf?.className || ''
                                                ].filter(Boolean).join(' ') || undefined}
                                                style={cellCf?.style as React.CSSProperties | undefined}
                                                onContextMenu={(e) => openCellMenu(e, row, col)}
                                            >
                                                {cellText(row[col], col)}
                                                {col === warningColumn && status === 'warning' && (
                                                    <span className="dl2-checklist-badge warning">Due Soon</span>
                                                )}
                                                {col === warningColumn && status === 'overdue' && (
                                                    <span className="dl2-checklist-badge overdue">Overdue</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={displayColumns.length + 1} style={{ textAlign: 'center', padding: 20 }}>
                                    No tasks found
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="dl2-table-pagination" style={{ marginTop: 10, justifyContent: 'center' }}>
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    <span style={{ margin: '0 10px' }}>
                        Page {currentPage} of {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}

            {menu && (
                <ContextMenu
                    items={menu.items}
                    position={menu.position}
                    onClose={() => setMenu(null)}
                />
            )}

            {/* Built-in row detail modal (used when no rowModalId is configured) */}
            {detailRow && (
                <div className="dl2-modal-overlay" onClick={() => setDetailRow(null)}>
                    <div className="dl2-modal-content dl2-row-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="dl2-modal-header">
                            <h2>{rowModalTitle || 'Details'}</h2>
                            <button className="dl2-modal-close-btn" onClick={() => setDetailRow(null)}>&times;</button>
                        </div>
                        <div className="dl2-modal-body">
                            <table className="dl2-table dl2-row-detail-table">
                                <tbody>
                                    <tr>
                                        <th>Status</th>
                                        <td>{STATUS_LABELS[statusOf(detailRow)]}</td>
                                    </tr>
                                    {(rowModalColumns && rowModalColumns.length > 0 ? rowModalColumns : displayColumns).map(col => (
                                        <tr key={col}>
                                            <th>{col}</th>
                                            <td>{cellText(detailRow[col], col)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </VisualContainer>
    );
};
