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

    let trendColor = '#666';
    let Caret = <span style={{ marginRight: 4 }}>-</span>;

    if (change !== 0) {
        const isPositive = change > 0;
        const isGood = goodDirection === 'higher' ? isPositive : !isPositive;
        
        trendColor = isGood ? '#2e7d32' : '#c62828';
        
        if (isPositive) {
            Caret = (
                <svg width="24" height="24" viewBox="0 0 24 24" fill={trendColor} style={{ marginRight: 2 }}>
                    <path d="M7 14l5-5 5 5z" />
                </svg>
            );
        } else {
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
            <span>{Math.abs(change * 100).toFixed(1)}% {textSuffix && textSuffix}</span>
        </div>
    );
};
