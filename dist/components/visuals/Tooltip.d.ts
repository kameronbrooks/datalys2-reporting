import React from "react";
export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}
/**
 * A standard tooltip that wraps an element and shows content on hover.
 */
export declare const Tooltip: React.FC<TooltipProps>;
export interface FloatingTooltipProps {
    /** CSS Left position (or clientX if standardizing on client coordinates) */
    left: number;
    /** CSS Top position (or clientY if standardizing on client coordinates) */
    top: number;
    /** Content to display */
    content: React.ReactNode;
    /** Optional class name */
    className?: string;
    /** Whether the coordinates are client coordinates (fixed) or absolute (page). Defaults to client/fixed. */
    coords?: 'client' | 'page';
}
/**
 * A tooltip component that can be positioned explicitly.
 * Ideal for charts where the tooltip follows the mouse or is positioned on datapoints.
 * Keeps itself within the viewport.
 */
export declare const FloatingTooltip: React.FC<FloatingTooltipProps>;
