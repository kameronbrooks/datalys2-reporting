import React from 'react';
export interface TrendIndicatorProps {
    change?: number;
    goodDirection?: 'higher' | 'lower';
    textSuffix?: string;
}
export declare const TrendIndicator: React.FC<TrendIndicatorProps>;
