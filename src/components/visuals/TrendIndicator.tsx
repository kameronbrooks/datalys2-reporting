import React from 'react';

export interface TrendIndicatorProps {
    change?: number;
    goodDirection?: 'higher' | 'lower';
    textSuffix?: string;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ 
    change, 
    goodDirection = 'higher', 
    textSuffix = undefined 
}) => {
    if (change === undefined) return null;

    let trendColor = 'var(--dl2-text-muted)';
    let Caret = <span style={{ marginRight: 4 }}>-</span>;

    if (change !== 0) {
        const isPositive = change > 0;
        // Determine if the change is "good" based on the desired direction
        const isGood = goodDirection === 'higher' ? isPositive : !isPositive;
        
        trendColor = isGood ? 'var(--dl2-success)' : 'var(--dl2-error)';
        
        if (isPositive) {
            // Upward arrow for positive change
            Caret = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={trendColor} style={{ marginRight: 2 }}>
                    <path d="M7 14l5-5 5 5z" />
                </svg>
            );
        } else {
            // Downward arrow for negative change
            Caret = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={trendColor} style={{ marginRight: 2 }}>
                    <path d="M7 10l5 5 5-5z" />
                </svg>
            );
        }
    }

    return (
        <div className="dl2-kpi-trend" style={{ display: 'flex', alignItems: 'center', fontSize: '0.9em', color: trendColor, marginTop: 5 }}>
            {Caret}
            {/* Display absolute percentage change with optional suffix */}
            <span>{Math.abs(change * 100).toFixed(1)}% {textSuffix && textSuffix}</span>
        </div>
    );
};
