import React, { useContext, useMemo, useState } from "react";
import { AppContext } from "../context/AppContext";
import type { ReportVisual, Dataset } from "../../lib/types";

export interface TableProps extends ReportVisual {
    columns?: string[]; // Optional: specific columns to show. If omitted, show all.
    pageSize?: number;
    tableStyle?: 'plain' | 'bordered' | 'alternating';
    showSearch?: boolean;
    title?: string;
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
    flex
}) => {
    const ctx = useContext(AppContext) || { datasets: {} };
    const dataset = ctx.datasets[datasetId];

    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

    // Helper to normalize data into array of objects
    const normalizedData = useMemo(() => {
        if (!dataset) return [];
        
        // If data is already array of objects (records format)
        if (dataset.data.length > 0 && typeof dataset.data[0] === 'object' && !Array.isArray(dataset.data[0])) {
            return dataset.data;
        }
        
        // If data is array of arrays (table format)
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

    // Determine columns to display
    const displayColumns = useMemo(() => {
        if (columns && columns.length > 0) return columns;
        if (dataset && dataset.columns) return dataset.columns;
        if (normalizedData.length > 0) return Object.keys(normalizedData[0]);
        return [];
    }, [columns, dataset, normalizedData]);

    // Filter, Sort, and Paginate
    const processedData = useMemo(() => {
        let data = [...normalizedData];

        // 1. Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            data = data.filter(row => 
                displayColumns.some(col => 
                    String(row[col]).toLowerCase().includes(lowerTerm)
                )
            );
        }

        // 2. Sort
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

    if (!dataset) {
        return <div style={{ padding: 10, color: 'red' }}>Dataset '{datasetId}' not found.</div>;
    }

    return (
        <div className="dl2-visual-container" style={{
            padding: padding || 10,
            margin: margin || 10,
            border: border ? '1px solid #ccc' : undefined,
            boxShadow: shadow ? '2px 2px 5px rgba(0, 0, 0, 0.1)' : undefined,
            flex: flex || 1,
            backgroundColor: 'white',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {title && <h3 style={{ margin: '0 0 15px 0' }}>{title}</h3>}

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
                <div style={{ fontSize: '0.9em', color: '#666' }}>
                    Showing {processedData.length} records
                </div>
            </div>

            <div className="dl2-table-container">
                <table className={`dl2-table ${tableStyle}`}>
                    <thead>
                        <tr>
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
                        {paginatedData.map((row, i) => (
                            <tr key={i}>
                                {displayColumns.map(col => (
                                    <td key={col}>{row[col]}</td>
                                ))}
                            </tr>
                        ))}
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={displayColumns.length} style={{ textAlign: 'center', padding: 20 }}>
                                    No data found
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
                <div style={{ padding: '10px 0 0 0', fontSize: '0.9em', color: '#666' }}>
                    {description}
                </div>
            )}
        </div>
    );
};
