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
export declare const getBreachStatus: (value: number, breachValue?: number, warningValue?: number, goodDirection?: "higher" | "lower") => BreachStatus;
/**
 * Returns the CSS variable color associated with a breach status.
 */
export declare const getBreachColor: (status: BreachStatus) => string;
export interface BreachIndicatorProps {
    status: BreachStatus;
}
/**
 * BreachIndicator Component
 * Renders an SVG icon (check, warning, or cross) based on the provided status.
 */
export declare const BreachIndicator: React.FC<BreachIndicatorProps>;
