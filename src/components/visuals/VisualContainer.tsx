import React from "react";
import { LayoutElement } from "../../lib/types";

export interface VisualContainerProps extends Pick<LayoutElement, 'padding' | 'margin' | 'border' | 'shadow' | 'flex'> {
    title?: string;
    description?: string;
    className?: string;
    /** Extra styles merged over the container defaults. */
    style?: React.CSSProperties;
    children?: React.ReactNode;
}

/**
 * Shared outer container for all visuals: applies the standard box-model
 * props (padding/margin/border/shadow/flex), background, and the optional
 * title/description.
 *
 * Spacing note: visuals default to margin 0 — spacing between visuals is
 * owned by the layout `gap` (default 10px).
 */
export const VisualContainer: React.FC<VisualContainerProps> = ({
    padding,
    margin,
    border,
    shadow,
    flex,
    title,
    description,
    className,
    style,
    children
}) => {
    return (
        <div
            className={`dl2-visual-container${className ? ` ${className}` : ''}`}
            style={{
                padding: padding ?? 10,
                margin: margin ?? 0,
                border: border ? '1px solid var(--dl2-border-main)' : undefined,
                boxShadow: shadow ? '2px 2px 5px var(--dl2-shadow)' : undefined,
                flex: flex ?? 1,
                backgroundColor: 'var(--dl2-bg-visual)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0,
                ...style
            }}
        >
            {title && <h3 style={{ margin: '0 0 15px 0' }}>{title}</h3>}
            {children}
            {description && (
                <div style={{ padding: '10px 0 0 0', fontSize: '0.9em', color: 'var(--dl2-text-muted)' }}>
                    {description}
                </div>
            )}
        </div>
    );
};
