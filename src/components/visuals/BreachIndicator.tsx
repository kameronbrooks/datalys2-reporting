import React from 'react';

export type BreachStatus = 'ok' | 'warning' | 'breach' | null;

export const getBreachStatus = (
    value: number,
    breachValue?: number,
    warningValue?: number,
    goodDirection: 'higher' | 'lower' = 'higher'
): BreachStatus => {
    if (breachValue === undefined) return null;

    if (goodDirection === 'higher') {
        if (value < breachValue) return 'breach';
        if (warningValue !== undefined && value < warningValue) return 'warning';
        return 'ok';
    } else {
        if (value > breachValue) return 'breach';
        if (warningValue !== undefined && value > warningValue) return 'warning';
        return 'ok';
    }
};

export const getBreachColor = (status: BreachStatus): string => {
    switch (status) {
        case 'breach': return '#c62828';
        case 'warning': return '#f57f17';
        case 'ok': return '#2e7d32';
        default: return 'inherit';
    }
};

export interface BreachIndicatorProps {
    status: BreachStatus;
}

export const BreachIndicator: React.FC<BreachIndicatorProps> = ({ status }) => {
    if (!status) return null;

    const color = getBreachColor(status);

    if (status === 'breach') {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
            </svg>
        );
    } else if (status === 'warning') {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
        );
    } else {
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        );
    }
};
