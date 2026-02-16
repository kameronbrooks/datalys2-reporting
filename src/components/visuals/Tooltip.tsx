import React, { useState, useRef, useEffect, useLayoutEffect } from "react";

export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

/**
 * A standard tooltip that wraps an element and shows content on hover.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsVisible(true);
        updatePosition(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isVisible) {
            updatePosition(e.clientX, e.clientY);
        }
    };

    /**
     * Calculates the optimal position for the tooltip relative to the mouse cursor.
     * Ensures the tooltip stays within the viewport boundaries.
     */
    const updatePosition = (clientX: number, clientY: number) => {
        // Defer to FloatingTooltip logic via reuse if possible, but for now duplicate logic to keep independent or refactor
        // Actually, let's reuse the logic by calling a helper or just using the same logic.
        // But since we want to expose a FloatingTooltip, let's implement the logic there and reuse it or just implement it here.
        
        // Since we can't easily share state between this and FloatingTooltip without a hook, 
        // I'll just keep this implementation simple and robust.
        
        const tooltipEl = tooltipRef.current;
        if (!tooltipEl) return;

        const { top, left } = calculatePosition(clientX, clientY, tooltipEl.offsetWidth, tooltipEl.offsetHeight);
        setPosition({ top, left });
    };

    return (
        <div
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ display: 'inline-block', position: 'relative' }}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        backgroundColor: 'var(--dl2-bg-main)',
                        color: 'var(--dl2-text-main)',
                        border: '1px solid var(--dl2-border-main)',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        zIndex: 10000,
                        pointerEvents: 'none',
                        whiteSpace: 'pre-line',
                        maxWidth: '300px',
                        boxShadow: '0 2px 8px var(--dl2-shadow)'
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    );
};

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
export const FloatingTooltip: React.FC<FloatingTooltipProps> = ({ left, top, content, className, coords = 'client' }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top, left });

    // Update position when props change, but constrain to viewport
    useLayoutEffect(() => {
        const el = tooltipRef.current;
        if (!el) return;

        const { top: finalTop, left: finalLeft } = calculatePosition(left, top, el.offsetWidth, el.offsetHeight);
        setPos({ top: finalTop, left: finalLeft });
    }, [left, top, content]);

    return (
        <div
            ref={tooltipRef}
            className={className}
            style={{
                position: 'fixed', // Always use fixed for viewport-relative positioning
                top: pos.top,
                left: pos.left,
                backgroundColor: 'var(--dl2-bg-main)',
                color: 'var(--dl2-text-main)',
                border: '1px solid var(--dl2-border-main)',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.85em',
                zIndex: 10000,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                maxWidth: '300px',
                boxShadow: '0 2px 8px var(--dl2-shadow)',
                transition: 'top 0.05s, left 0.05s' // Smooth movement
            }}
        >
            {content}
        </div>
    );
};

/**
 * Helper to calculate tooltip position staying within viewport
 */
function calculatePosition(x: number, y: number, width: number, height: number) {
    const offsetX = 15;
    const offsetY = 15;
    const padding = 10; // Padding from window edges

    let left = x + offsetX;
    let top = y + offsetY; // Default below cursor

    // Check right edge
    if (left + width + padding > window.innerWidth) {
        // Try placing it to the left of the cursor
        left = x - width - offsetX;
        
        // If it still doesn't fit (off screen left), clamp it
        if (left < padding) {
             left = Math.max(padding, window.innerWidth - width - padding);
        }
    }

    // Check bottom edge
    if (top + height + padding > window.innerHeight) {
        // Try placing it above the cursor
        top = y - height - offsetY;

        // If it still doesn't fit (off screen top), clamp it
        if (top < padding) {
             top = Math.max(padding, window.innerHeight - height - padding);
        }
    }
    
    // Ensure it's not off-screen left/top (double check)
    left = Math.max(padding, left);
    top = Math.max(padding, top);

    return { left, top };
}

