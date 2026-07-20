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
export declare const VisualContainer: React.FC<VisualContainerProps>;
