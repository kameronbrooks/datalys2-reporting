import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, AggregateColumn } from "../../lib/types";
import { isDate, printDate } from "../../lib/date-utility";
import { multiSort, SortKey } from "../../lib/sort-utility";
import { computeAggregates } from "../../lib/aggregate-utility";
import { toCSV, toTSV, downloadCSV, copyTextToClipboard, formatCellForExport } from "../../lib/export-utility";
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
    stickyHeader
}) => {
    const ctx = useContext(AppContext);
    const dataset = ctx.datasets[datasetId];

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortKeys, setSortKeys] = useState<SortKey[]>(
        () => (defaultSort || []).map(s => ({ key: s.column, direction: s.direction }))
    );
    const [hiddenCols, setHiddenCols] = useState<string[]>(initialHiddenColumns || []);
    const [groupByCol, setGroupByCol] = useState<string | null>(initialGroupBy || null);
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
    const [allCollapsed] = useState(groupsCollapsed);
    const [menu, setMenu] = useState<MenuState | null>(null);

    const useStickyHeader = stickyHeader ?? (maxHeight !== undefined);

    /**
     * Normalizes the dataset into an array of objects (records).
     * Handles both array-of-arrays and array-of-objects formats.
     */
    const normalizedData = useMemo(() => {
        if (!dataset) return [];

        // If data is already array of objects (records format)
        if (dataset.data.length > 0 && typeof dataset.data[0] === 'object' && !Array.isArray(dataset.data[0])) {
            return dataset.data;
        }

        // If data is array of arrays (table format), map columns to keys
        if (dataset.data.length > 0 && Array.isArray(dataset.data[0])) {
            return dataset.data.map((row: any[]) => {
                const obj: any = {};
                dataset.columns.forEach((col, index) => {
                    obj[col] = row[index];
                });
                return obj;
            });
        }

        return [];
    }, [dataset]);

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
        copyTextToClipboard(toTSV(displayColumns, processedData));
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
        setMenu({ position: { x: e.clientX, y: e.clientY }, items });
    };

    /** Builds the context menu for a body cell. */
    const openCellMenu = (e: React.MouseEvent, row: any, col: string) => {
        if (!contextMenu) return;
        e.preventDefault();
        e.stopPropagation();
        const items: ContextMenuItem[] = [
            { label: 'Copy cell', onClick: () => copyTextToClipboard(formatCellForExport(row[col])) },
            { label: 'Copy row', onClick: () => copyTextToClipboard(displayColumns.map(c => formatCellForExport(row[c])).join('\t')) },
        ];
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

    const renderCell = (val: any) => isDate(val) ? printDate(val, undefined, true) : String(val);

    const renderDataRow = (row: any, i: number, indent: boolean = false) => (
        <tr key={i}>
            {displayColumns.map((col, colIndex) => {
                const val = row[col];
                return (
                    <td
                        key={col}
                        style={indent && colIndex === 0 ? { paddingLeft: 24 } : undefined}
                        onContextMenu={(e) => openCellMenu(e, row, col)}
                    >
                        {renderCell(val)}
                    </td>
                );
            })}
        </tr>
    );

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
                                        <td colSpan={displayColumns.length}>
                                            <span className="dl2-table-group-caret">
                                                {isGroupCollapsed(group.keyString) ? '▸' : '▾'}
                                            </span>
                                            <b>{groupByCol}:</b> {renderCell(group.key)}
                                            <span style={{ color: 'var(--dl2-text-muted)', marginLeft: 8 }}>
                                                ({group.rows.length} {group.rows.length === 1 ? 'row' : 'rows'})
                                            </span>
                                            {group.aggregates && Object.entries(group.aggregates).map(([name, value]) => (
                                                <span key={name} className="dl2-table-group-agg">
                                                    {name}: <b>{typeof value === 'number' ? +value.toFixed(4) : renderCell(value)}</b>
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
                                <td colSpan={displayColumns.length} style={{ textAlign: 'center', padding: 20 }}>
                                    No data found
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
        </VisualContainer>
    );
};
