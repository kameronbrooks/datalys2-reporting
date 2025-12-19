import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "../../lib/types";

export interface ChecklistProps extends ReportVisual {
    columns?: string[];
    statusColumn: string;
    warningColumn?: string;
    warningThreshold?: number; // Days
    title?: string;
    pageSize?: number;
    showSearch?: boolean;
}

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
    showSearch = true
}) => {
    const ctx = useContext(AppContext) || { datasets: {} };
    const dataset = ctx.datasets[datasetId];

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    const normalizedData = useMemo(() => {
        if (!dataset) return [];
        
        if (dataset.data.length > 0 && typeof dataset.data[0] === 'object' && !Array.isArray(dataset.data[0])) {
            return dataset.data;
        }
        
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

    const displayColumns = useMemo(() => {
        if (columns && columns.length > 0) return columns;
        if (dataset && dataset.columns) return dataset.columns.filter(c => c !== statusColumn);
        if (normalizedData.length > 0) return Object.keys(normalizedData[0]).filter(c => c !== statusColumn);
        return [];
    }, [columns, dataset, normalizedData, statusColumn]);

    const processedData = useMemo(() => {
        let data = [...normalizedData];

        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(row => 
                displayColumns.some(col => 
                    String(row[col]).toLowerCase().includes(lowerTerm)
                )
            );
        }

        if (sortConfig) {
            data.sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [normalizedData, searchTerm, sortConfig, displayColumns]);

    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getRowStatus = (row: any) => {
        const isComplete = !!row[statusColumn];
        if (isComplete) return 'complete';

        if (warningColumn && row[warningColumn]) {
            const dueDate = new Date(row[warningColumn]);
            const now = new Date();
            const diffTime = dueDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'overdue';
            if (diffDays <= warningThreshold) return 'warning';
        }

        return 'pending';
    };

    if (!dataset) {
        return <div style={{ padding: 10, color: 'var(--dl2-error)' }}>Dataset '{datasetId}' not found.</div>;
    }

    return (
        <div className="dl2-visual-container" style={{
            padding: padding || 10,
            margin: margin || 10,
            border: border ? '1px solid var(--dl2-border-main)' : undefined,
            boxShadow: shadow ? '2px 2px 5px var(--dl2-shadow)' : undefined,
            flex: flex || 1,
            backgroundColor: 'var(--dl2-bg-visual)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {title && <h3 style={{ margin: '0 0 15px 0' }}>{title}</h3>}

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
                <div style={{ fontSize: '0.9em', color: 'var(--dl2-text-muted)' }}>
                    {processedData.filter(r => !!r[statusColumn]).length} / {processedData.length} Completed
                </div>
            </div>

            <div className="dl2-table-container">
                <table className="dl2-table dl2-checklist">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}></th>
                            {displayColumns.map(col => (
                                <th key={col} onClick={() => handleSort(col)}>
                                    {col}
                                    {sortConfig?.key === col && (
                                        <span style={{ marginLeft: 5 }}>
                                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                        </span>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, i) => {
                            const status = getRowStatus(row);
                            return (
                                <tr key={i} className={`dl2-checklist-row ${status}`}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={status === 'complete'} 
                                            readOnly 
                                            style={{ cursor: 'default' }}
                                        />
                                    </td>
                                    {displayColumns.map(col => (
                                        <td key={col} className={col === warningColumn ? 'dl2-checklist-date' : ''}>
                                            {row[col]}
                                            {col === warningColumn && status === 'warning' && (
                                                <span className="dl2-checklist-badge warning">Due Soon</span>
                                            )}
                                            {col === warningColumn && status === 'overdue' && (
                                                <span className="dl2-checklist-badge overdue">Overdue</span>
                                            )}
                                        </td>
                                    ))}
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

            {description && (
                <div style={{ padding: '10px 0 0 0', fontSize: '0.9em', color: 'var(--dl2-text-muted)' }}>
                    {description}
                </div>
            )}
        </div>
    );
};
