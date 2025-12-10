import React, { useState, useRef, useEffect } from "react";

export interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = (e: React.MouseEvent) => {
        setIsVisible(true);
        updatePosition(e);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isVisible) {
            updatePosition(e);
        }
    };

    const updatePosition = (e: React.MouseEvent) => {
        if (!containerRef.current || !tooltipRef.current) return;

        const tooltipWidth = tooltipRef.current.offsetWidth;
        const tooltipHeight = tooltipRef.current.offsetHeight;
        const offsetX = 10;
        const offsetY = 10;

        let left = e.clientX + offsetX;
        let top = e.clientY + offsetY;

        // Adjust if tooltip goes off right edge
        if (left + tooltipWidth > window.innerWidth) {
            left = e.clientX - tooltipWidth - offsetX;
        }

        // Adjust if tooltip goes off bottom edge
        if (top + tooltipHeight > window.innerHeight) {
            top = e.clientY - tooltipHeight - offsetY;
        }

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
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        zIndex: 10000,
                        pointerEvents: 'none',
                        whiteSpace: 'pre-line',
                        maxWidth: '300px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {content}
                </div>
            )}
        </div>
    );
};
