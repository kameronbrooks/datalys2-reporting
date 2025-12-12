import React from 'react';
export type BreachStatus = 'ok' | 'warning' | 'breach' | null;
export declare const getBreachStatus: (value: number, breachValue?: number, warningValue?: number, goodDirection?: "higher" | "lower") => BreachStatus;
export declare const getBreachColor: (status: BreachStatus) => string;
export interface BreachIndicatorProps {
    status: BreachStatus;
}
export declare const BreachIndicator: React.FC<BreachIndicatorProps>;
