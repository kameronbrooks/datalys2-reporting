import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, AggregateColumn, AggFn } from "../../lib/types";
import { isDate, printDate } from "../../lib/date-utility";
import { multiSort, SortKey } from "../../lib/sort-utility";
import { loadVisualState, saveVisualState, clearVisualState } from "../../lib/state-persistence";
import { computeAggregates } from "../../lib/aggregate-utility";
import { toCSV, toTSV, downloadCSV, copyTextToClipboard } from "../../lib/export-utility";
import { formatValue, resolveColumnFormats, ColumnFormatsProp, ColumnFormat } from "../../lib/format-utility";
import { ConditionalFormat, evaluateConditionalFormats } from "../../lib/conditional-format-utility";
import { toRecords } from "../../lib/dataset-utility";
import { ContextMenu, ContextMenuItem } from "../ContextMenu";
import { VisualContainer } from "./VisualContainer";

export interface TableProps extends ReportVisual {
    columns?: string[]; // Optional: specific columns to show. If omitted, show all.
    pageSize?: number;
    tableStyle?: 'plain' | 'bordered' | 'alternating';
    showSearch?: boolean;
    title?: string;
    /** Enable click-to-sort on headers. Default true. */
    sortable?: boolean;
    /** Initial sort keys (multi-sort priority order). */
    defaultSort?: { column: string; direction: 'asc' | 'desc' }[];
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
    totalRow?: boolean | { label?: string; fns?: Record<string, AggFn> };
    /**
     * Per-row total column appended on the right. `true` sums every numeric
     * visible column; or pass `{ label, columns }` to control which columns
     * are summed.
     */
    totalColumn?: boolean | { label?: string; columns?: string[] };
    /**
     * Allow opening a row (double-click or context menu) in a detail modal
     * showing the row's values. Defaults to the visible columns; use
     * `rowModalColumns` to show any dataset columns instead.
     */
    rowModal?: boolean;
    /**
     * Open rows in a custom modal (from the report's `modals` array) instead
     * of the default detail view. Cards inside the modal can reference the
     * clicked row via {{ row.ColumnName }}. Implies `rowModal`.
     */
    rowModalId?: string;
    /** Columns shown in the DEFAULT row detail modal (may include hidden ones). */
    rowModalColumns?: string[];
    /** Title of the default row detail modal. Default: "Details". */
    rowModalTitle?: string;
    /**
     * Persist runtime view changes (sort, hidden columns, grouping) in the
     * browser so they survive reloads. Requires the visual to have an `id`.
     * Default true when an `id` is present. Reset via right-click →
     * "Reset view", or the report-wide reset in the headbar.
     */
    persistState?: boolean;
    /**
     * Per-column display formats, e.g.
     * { "amount": { "format": "currency", "digits": 0 }, "created": "date" }.
     * Applies to cells, totals, and group aggregates. Display-only — CSV
     * export keeps raw values (clipboard copy uses the formatted view).
     */
    columnFormats?: ColumnFormatsProp;
    /**
     * Cell/row highlight rules evaluated per data row with the standard
     * filter grammar, e.g.
     * [{ "when": { "column": "amount", "op": "gt", "value": 10000 }, "style": "success" }].
     * First matching rule wins per target; totals/aggregate rows are exempt.
     */
    conditionalFormats?: ConditionalFormat[];
}

/** The slice of table view state that persists across reloads. */
interface PersistedTableState {
    sortKeys?: SortKey[];
    hiddenCols?: string[];
    groupByCol?: string | null;
}

interface MenuState {
    position: { x: number; y: number };
    items: ContextMenuItem[];
}

export const Table: React.FC<TableProps> = ({
    datasetId,
    columns,
    pageSize = 10,
    tableStyle = 'plain',
    showSearch = true,
    title,
    description,
    padding,
    margin,
    border,
    shadow,
    flex,
    sortable = true,
    defaultSort,
    hiddenColumns: initialHiddenColumns,
    allowColumnHiding = true,
    groupBy: initialGroupBy,
    groupAggregates,
    groupsCollapsed = false,
    enableExport = true,
    exportFileName,
    contextMenu = true,
    maxHeight,
    stickyHeader,
    totalRow,
    totalColumn,
    rowModal,
    rowModalId,
    rowModalColumns,
    rowModalTitle,
    persistState,
    columnFormats,
    conditionalFormats,
    id
}) => {
    const ctx = useContext(AppContext);
    const dataset = ctx.datasets[datasetId];
    const rowOpenEnabled = rowModal === true || !!rowModalId;

    // View-state persistence: on by default when the visual has an id.
    const persistenceEnabled = (persistState ?? true) && !!id;
    const savedState = useMemo<PersistedTableState | null>(
        () => persistenceEnabled ? loadVisualState<PersistedTableState>(id!) : null,
        // Load once per mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKeys, setSortKeys] = useState<SortKey[]>(
        () => savedState?.sortKeys
            ?? (defaultSort || []).map(s => ({ key: s.column, direction: s.direction }))
    );
    const [hiddenCols, setHiddenCols] = useState<string[]>(
        () => savedState?.hiddenCols ?? (initialHiddenColumns || [])
    );
    const [groupByCol, setGroupByCol] = useState<string | null>(
        () => savedState?.groupByCol !== undefined ? savedState.groupByCol : (initialGroupBy || null)
    );
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [allCollapsed] = useState(groupsCollapsed);
    const [menu, setMenu] = useState<MenuState | null>(null);
    const [detailRow, setDetailRow] = useState<any | null>(null);

    const useStickyHeader = stickyHeader ?? (maxHeight !== undefined);

    // Save view state on change (skipping the initial render so untouched
    // tables leave no storage entries behind).
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true;
            return;
        }
        if (!persistenceEnabled) return;
        saveVisualState(id!, { sortKeys, hiddenCols, groupByCol } satisfies PersistedTableState);
    }, [persistenceEnabled, id, sortKeys, hiddenCols, groupByCol]);

    /** Clears saved state and restores the config-defined defaults. */
    const resetViewState = () => {
        if (persistenceEnabled) clearVisualState(id!);
        setSortKeys((defaultSort || []).map(s => ({ key: s.column, direction: s.direction })));
        setHiddenCols(initialHiddenColumns || []);
        setGroupByCol(initialGroupBy || null);
        setCollapsedGroups({});
        setSearchTerm("");
        setCurrentPage(1);
    };

    /** Opens the detail view for a row — custom modal if configured, else the built-in one. */
    const openRowDetails = (row: any) => {
        if (!rowOpenEnabled) return;
        if (rowModalId) {
            ctx.openModal(rowModalId, { row, datasetId });
        } else {
            setDetailRow(row);
        }
    };

    /**
     * Normalizes the dataset into an array of objects (records).
     * Handles both array-of-arrays and array-of-objects formats.
     */
    const normalizedData = useMemo(() => toRecords(dataset), [dataset]);

    const colFormats = useMemo(() => resolveColumnFormats(columnFormats), [columnFormats]);

    /**
     * All columns the table could display (before hiding).
     * Priority: Props.columns > Dataset.columns > Object keys.
     */
    const allColumns = useMemo(() => {
        if (columns && columns.length > 0) return columns;
        if (dataset && dataset.columns) return dataset.columns;
        if (normalizedData.length > 0) return Object.keys(normalizedData[0]);
        return [];
    }, [columns, dataset, normalizedData]);

    /** Columns currently visible. */
    const displayColumns = useMemo(
        () => allColumns.filter(col => !hiddenCols.includes(col)),
        [allColumns, hiddenCols]
    );

    /**
     * Applies filtering (search) and sorting to the normalized data.
     */
    const processedData = useMemo(() => {
        /** Dtype lookup for type-aware sorting. */
        const dtypeOf = (col: string): string | undefined => {
            if (!dataset || !dataset.columns || !dataset.dtypes) return undefined;
            const index = dataset.columns.indexOf(col);
            return index >= 0 ? dataset.dtypes[index] : undefined;
        };

        let data = [...normalizedData];

        // 1. Filter based on search term across all display columns
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(row =>
                displayColumns.some(col => {
                    const val = row[col];
                    const stringVal = isDate(val) ? printDate(val, undefined, true) : String(val);
                    return stringVal.toLowerCase().includes(lowerTerm);
                })
            );
        }

        // 2. Sort (multi-key, type-aware)
        if (sortKeys.length > 0) {
            data = multiSort(data, sortKeys.map(k => ({ ...k, dtype: dtypeOf(k.key) })));
        }

        return data;
    }, [normalizedData, searchTerm, sortKeys, displayColumns, dataset]);

    /**
     * Groups the processed data when grouping is active.
     */
    const groupedData = useMemo(() => {
        if (!groupByCol) return null;
        const groups = new Map<string, { key: any; rows: any[] }>();
        processedData.forEach(row => {
            const value = row[groupByCol];
            const keyString = isDate(value) ? printDate(value, undefined, true) : String(value);
            let group = groups.get(keyString);
            if (!group) {
                group = { key: value, rows: [] };
                groups.set(keyString, group);
            }
            group.rows.push(row);
        });
        return Array.from(groups.entries()).map(([keyString, group]) => ({
            keyString,
            key: group.key,
            rows: group.rows,
            aggregates: groupAggregates && groupAggregates.length > 0 && dataset
                ? computeAggregates(group.rows, groupAggregates, dataset)
                : null
        }));
    }, [processedData, groupByCol, groupAggregates, dataset]);

    // --- Totals ---------------------------------------------------------
    const totalRowCfg = totalRow === true ? {} : (totalRow || null);
    const totalColCfg = totalColumn === true ? {} : (totalColumn || null);

    /** Whether a column holds numeric data (by dtype, falling back to values). */
    const isNumericColumn = (col: string): boolean => {
        if (dataset && dataset.columns && dataset.dtypes) {
            const index = dataset.columns.indexOf(col);
            if (index >= 0 && dataset.dtypes[index]) {
                return ['int', 'float', 'number'].includes(dataset.dtypes[index]);
            }
        }
        const sample = normalizedData.find(row => row[col] !== null && row[col] !== undefined);
        return sample ? typeof sample[col] === 'number' : false;
    };

    /** Columns included in the per-row total column. */
    const totalColSourceColumns = useMemo(() => {
        if (!totalColCfg) return [];
        if (totalColCfg.columns && totalColCfg.columns.length > 0) return totalColCfg.columns;
        return displayColumns.filter(isNumericColumn);
    }, [totalColCfg, displayColumns, dataset, normalizedData]);

    const rowTotal = (row: any): number =>
        totalColSourceColumns.reduce((acc, col) => {
            const val = row[col];
            return acc + (typeof val === 'number' && !isNaN(val) ? val : 0);
        }, 0);

    /** Grand-total values per visible column (over ALL filtered rows). */
    const totalRowValues = useMemo(() => {
        if (!totalRowCfg || !dataset) return null;
        const fns = totalRowCfg.fns;
        const specs: AggregateColumn[] = displayColumns
            .filter(col => fns ? fns[col] !== undefined : isNumericColumn(col))
            .map(col => ({ column: col, fn: (fns ? fns[col] : 'sum') as AggFn, as: col }));
        if (specs.length === 0) return null;
        return computeAggregates(processedData, specs, dataset);
    }, [totalRowCfg, displayColumns, processedData, dataset]);

    const totalColLabel = totalColCfg?.label ?? 'Total';
    const totalRowLabel = totalRowCfg?.label ?? 'Total';
    /** Total number of rendered columns incl. the virtual total column. */
    const renderColumnCount = displayColumns.length + (totalColCfg ? 1 : 0);

    /**
     * Format for the per-row total column: used when every summed source
     * column shares the same column format (e.g. all currency).
     */
    const totalColFormat = useMemo<ColumnFormat | undefined>(() => {
        if (totalColSourceColumns.length === 0) return undefined;
        const first = colFormats[totalColSourceColumns[0]];
        if (!first) return undefined;
        const same = totalColSourceColumns.every(
            col => JSON.stringify(colFormats[col]) === JSON.stringify(first)
        );
        return same ? first : undefined;
    }, [totalColSourceColumns, colFormats]);

    const formatTotal = (value: any, fmt?: ColumnFormat): string => {
        if (value === null || value === undefined) return '';
        if (fmt) return formatValue(value, fmt);
        if (typeof value === 'number') return (+value.toFixed(4)).toLocaleString();
        return isDate(value) ? printDate(value, undefined, true) : String(value);
    };

    // Pagination: by rows normally, by groups when grouped.
    const totalPages = groupedData
        ? Math.ceil(groupedData.length / pageSize)
        : Math.ceil(processedData.length / pageSize);
    const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const paginatedGroups = groupedData
        ? groupedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : null;

    const isGroupCollapsed = (keyString: string): boolean => collapsedGroups[keyString] ?? allCollapsed;

    const toggleGroup = (keyString: string) => {
        setCollapsedGroups(prev => ({ ...prev, [keyString]: !isGroupCollapsed(keyString) }));
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
            // Replace-sort cycle: asc → desc → clear
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

    const setGrouping = (col: string | null) => {
        setGroupByCol(col);
        setCollapsedGroups({});
        setCurrentPage(1);
    };

    const doExportCSV = () => {
        downloadCSV(
            exportFileName || title || datasetId || 'table',
            toCSV(displayColumns, processedData)
        );
    };

    const doCopyTable = () => {
        // Clipboard copies match the on-screen (formatted) view; CSV export
        // above intentionally keeps raw values.
        copyTextToClipboard(toTSV(displayColumns, processedData.map(row => {
            const display: Record<string, string> = {};
            displayColumns.forEach(col => { display[col] = cellText(row[col], col); });
            return display;
        })));
    };

    /** Builds the context menu for a header cell. */
    const openHeaderMenu = (e: React.MouseEvent, col: string) => {
        if (!contextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        const items: ContextMenuItem[] = [];
        if (sortable) {
            const current = sortKeys.length === 1 ? sortKeys.find(k => k.key === col) : undefined;
            items.push(
                { label: 'Sort ascending', onClick: () => setSort(col, 'asc'), checked: current?.direction === 'asc' },
                { label: 'Sort descending', onClick: () => setSort(col, 'desc'), checked: current?.direction === 'desc' },
                { label: 'Clear sort', onClick: () => setSortKeys([]), disabled: sortKeys.length === 0 },
                { separator: true }
            );
        }
        if (allowColumnHiding) {
            items.push({ label: `Hide "${col}"`, onClick: () => hideColumn(col), disabled: displayColumns.length <= 1 });
        }
        items.push(
            groupByCol === col
                ? { label: 'Ungroup', onClick: () => setGrouping(null) }
                : { label: `Group by "${col}"`, onClick: () => setGrouping(col) }
        );
        if (enableExport) {
            items.push(
                { separator: true },
                { label: 'Export CSV', onClick: doExportCSV },
                { label: 'Copy table to clipboard', onClick: doCopyTable }
            );
        }
        items.push(
            { separator: true },
            { label: 'Reset view', onClick: resetViewState }
        );
        setMenu({ position: { x: e.clientX, y: e.clientY }, items });
    };

    /** Builds the context menu for a body cell. */
    const openCellMenu = (e: React.MouseEvent, row: any, col: string) => {
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
        items.push(
            { label: 'Copy cell', onClick: () => copyTextToClipboard(cellText(row[col], col)) },
            { label: 'Copy row', onClick: () => copyTextToClipboard(displayColumns.map(c => cellText(row[c], c)).join('\t')) },
        );
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

    const renderCell = (val: any) =>
        val === null || val === undefined ? '' : (isDate(val) ? printDate(val, undefined, true) : String(val));

    /** Cell display text: column format when configured, default rendering otherwise. */
    const cellText = (val: any, col: string) =>
        colFormats[col] ? formatValue(val, colFormats[col]) : renderCell(val);

    const renderDataRow = (row: any, i: number, indent: boolean = false) => {
        const cf = evaluateConditionalFormats(row, conditionalFormats, dataset);
        const rowClasses = [
            rowOpenEnabled ? 'dl2-table-row--openable' : '',
            cf?.row?.className || ''
        ].filter(Boolean).join(' ');
        return (
            <tr
                key={i}
                className={rowClasses || undefined}
                style={cf?.row?.style as React.CSSProperties | undefined}
                onDoubleClick={rowOpenEnabled ? () => openRowDetails(row) : undefined}
                title={rowOpenEnabled ? 'Double-click to open details' : undefined}
            >
                {displayColumns.map((col, colIndex) => {
                    const cellCf = cf?.cells[col];
                    const style: React.CSSProperties = {
                        ...(indent && colIndex === 0 ? { paddingLeft: 24 } : undefined),
                        ...(cellCf?.style as React.CSSProperties | undefined)
                    };
                    return (
                        <td
                            key={col}
                            className={cellCf?.className}
                            style={Object.keys(style).length > 0 ? style : undefined}
                            onContextMenu={(e) => openCellMenu(e, row, col)}
                        >
                            {cellText(row[col], col)}
                        </td>
                    );
                })}
                {totalColCfg && (
                    <td className="dl2-table-total-col">{formatTotal(rowTotal(row), totalColFormat)}</td>
                )}
            </tr>
        );
    };

    const thStyle: React.CSSProperties | undefined = useStickyHeader
        ? { position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'var(--dl2-bg-visual)' }
        : undefined;

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
            {/* Table Controls: Search, Grouping chip, Columns, Export, Record Count */}
            <div className="dl2-table-controls">
                {showSearch && (
                    <input
                        type="text"
                        placeholder="Search..."
                        className="dl2-table-search"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // Reset to first page on search
                        }}
                    />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                    {groupByCol && (
                        <span className="dl2-table-group-chip">
                            Grouped by <b>{groupByCol}</b>
                            <button
                                className="dl2-table-toolbar-btn"
                                title="Remove grouping"
                                onClick={() => setGrouping(null)}
                            >
                                ✕
                            </button>
                        </span>
                    )}
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
                        {groupedData
                            ? `${groupedData.length} groups · ${processedData.length} records`
                            : `Showing ${processedData.length} records`}
                    </div>
                </div>
            </div>

            {/* Main Table Rendering */}
            <div
                className="dl2-table-container"
                style={maxHeight !== undefined ? { maxHeight, overflow: 'auto' } : undefined}
            >
                <table className={`dl2-table ${tableStyle}`}>
                    <thead>
                        <tr>
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
                            {totalColCfg && (
                                <th className="dl2-table-total-col" style={{ ...thStyle, cursor: 'default' }}>
                                    {totalColLabel}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedGroups ? (
                            paginatedGroups.map(group => (
                                <React.Fragment key={group.keyString}>
                                    <tr
                                        className="dl2-table-group-row"
                                        onClick={() => toggleGroup(group.keyString)}
                                    >
                                        <td colSpan={renderColumnCount}>
                                            <span className="dl2-table-group-caret">
                                                {isGroupCollapsed(group.keyString) ? '▸' : '▾'}
                                            </span>
                                            <b>{groupByCol}:</b> {renderCell(group.key)}
                                            <span style={{ color: 'var(--dl2-text-muted)', marginLeft: 8 }}>
                                                ({group.rows.length} {group.rows.length === 1 ? 'row' : 'rows'})
                                            </span>
                                            {group.aggregates && Object.entries(group.aggregates).map(([name, value]) => (
                                                <span key={name} className="dl2-table-group-agg">
                                                    {name}: <b>{colFormats[name]
                                                        ? formatValue(value, colFormats[name])
                                                        : (typeof value === 'number' ? +value.toFixed(4) : renderCell(value))}</b>
                                                </span>
                                            ))}
                                        </td>
                                    </tr>
                                    {!isGroupCollapsed(group.keyString) && group.rows.map((row, i) => renderDataRow(row, i, true))}
                                </React.Fragment>
                            ))
                        ) : (
                            paginatedData.map((row, i) => renderDataRow(row, i))
                        )}
                        {((paginatedGroups && paginatedGroups.length === 0) || (!paginatedGroups && paginatedData.length === 0)) && (
                            <tr>
                                <td colSpan={renderColumnCount} style={{ textAlign: 'center', padding: 20 }}>
                                    No data found
                                </td>
                            </tr>
                        )}
                    </tbody>
                    {(totalRowValues || (totalColCfg && totalRowCfg)) && processedData.length > 0 && (
                        <tfoot>
                            <tr className={`dl2-table-total-row${useStickyHeader ? ' dl2-table-total-row--sticky' : ''}`}>
                                {displayColumns.map((col, colIndex) => {
                                    const value = totalRowValues?.[col];
                                    if (value !== undefined && value !== null) {
                                        return <td key={col}>{formatTotal(value, colFormats[col])}</td>;
                                    }
                                    return <td key={col}>{colIndex === 0 ? totalRowLabel : ''}</td>;
                                })}
                                {totalColCfg && (
                                    <td className="dl2-table-total-col">
                                        {formatTotal(processedData.reduce((acc, row) => acc + rowTotal(row), 0), totalColFormat)}
                                    </td>
                                )}
                            </tr>
                        </tfoot>
                    )}
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
                        Page {currentPage} of {totalPages}{groupedData ? ' (by group)' : ''}
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
