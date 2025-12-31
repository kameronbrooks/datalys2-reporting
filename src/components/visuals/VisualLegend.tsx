import React, { useState } from "react";

export interface VisualLegendItem {
    key: string;
    label: string;
    value?: number;
    percentage?: number;
    fill: string;
}

export interface VisualLegendProps {
    title?: string;
    items: VisualLegendItem[];
}

export const VisualLegend: React.FC<VisualLegendProps> = ({ title, items }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!items || items.length === 0) {
        return null;
    }

    // Determine which columns to show based on available data in items
    const showValues = items.some(item => item.value !== undefined);
    const showPercentages = items.some(item => item.percentage !== undefined);

    return (
        <div className="dl2-visual-legend" style={{ marginTop: '10px' }}>
            {/* Legend Header with Toggle functionality */}
            <div 
                className="dl2-visual-legend-header" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    paddingBottom: '5px', 
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--dl2-border-main)' 
                }}
            >
                <div className="dl2-visual-legend-title" style={{ fontWeight: 'bold' }}>{title || 'Legend'}</div>
                <span style={{ fontSize: '0.8em' }}>{isCollapsed ? '▼' : '▲'}</span>
            </div>
            
            {!isCollapsed && (
                <table className="dl2-visual-legend-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '0.9em' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--dl2-border-table)', color: 'var(--dl2-text-muted)' }}>
                            <th style={{ textAlign: 'left', padding: '4px' }}>Category</th>
                            {showValues && <th style={{ textAlign: 'right', padding: '4px' }}>Value</th>}
                            {showPercentages && <th style={{ textAlign: 'right', padding: '4px' }}>%</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.key} style={{ borderBottom: '1px solid var(--dl2-border-table)' }}>
                                <td style={{ padding: '4px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        {/* Color swatch for the series */}
                                        <span
                                            className="dl2-visual-legend-swatch"
                                            style={{ 
                                                backgroundColor: item.fill,
                                                width: '10px',
                                                height: '10px',
                                                display: 'inline-block',
                                                marginRight: '8px',
                                                borderRadius: '50%'
                                            }}
                                        />
                                        <span className="dl2-visual-legend-label">{item.label}</span>
                                    </div>
                                </td>
                                {showValues && <td style={{ textAlign: 'right', padding: '4px' }}>{item.value?.toLocaleString()}</td>}
                                {showPercentages && <td style={{ textAlign: 'right', padding: '4px' }}>{item.percentage?.toFixed(1)}%</td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
