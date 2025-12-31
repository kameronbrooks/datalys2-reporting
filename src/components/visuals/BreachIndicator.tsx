import React from 'react';

/** Possible status levels for a metric relative to its thresholds. */
export type BreachStatus = 'ok' | 'warning' | 'breach' | null;

/**
 * Determines the breach status based on a value and its thresholds.
 * 
 * @param value The current value to check.
 * @param breachValue The threshold that defines a breach.
 * @param warningValue The threshold that defines a warning.
 * @param goodDirection Whether higher or lower values are considered 'good'.
 * @returns The calculated BreachStatus.
 */
export const getBreachStatus = (
    value: number,
    breachValue?: number,
    warningValue?: number,
    goodDirection: 'higher' | 'lower' = 'higher'
): BreachStatus => {
    if (breachValue === undefined) return null;

    if (goodDirection === 'higher') {
        // If higher is good, then values below thresholds are bad
        if (value < breachValue) return 'breach';
        if (warningValue !== undefined && value < warningValue) return 'warning';
        return 'ok';
    } else {
        // If lower is good, then values above thresholds are bad
        if (value > breachValue) return 'breach';
        if (warningValue !== undefined && value > warningValue) return 'warning';
        return 'ok';
    }
};

/**
 * Returns the CSS variable color associated with a breach status.
 */
export const getBreachColor = (status: BreachStatus): string => {
    switch (status) {
        case 'breach': return 'var(--dl2-error)';
        case 'warning': return 'var(--dl2-warning)';
        case 'ok': return 'var(--dl2-success)';
        default: return 'inherit';
    }
};

export interface BreachIndicatorProps {
    status: BreachStatus;
}

/**
 * BreachIndicator Component
 * Renders an SVG icon (check, warning, or cross) based on the provided status.
 */
export const BreachIndicator: React.FC<BreachIndicatorProps> = ({ status }) => {
    if (!status) return null;

    const color = getBreachColor(status);

    if (status === 'breach') {
        // Render cross icon for breach
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
            </svg>
        );
    } else if (status === 'warning') {
        // Render exclamation icon for warning
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
        );
    } else {
        // Render checkmark icon for ok
        return (
            <svg width="24" height="24" viewBox="0 0 24 24" fill={color} style={{ marginLeft: 8 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
        );
    }
};
