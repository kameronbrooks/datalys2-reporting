import React from "react";
export interface ContextMenuItem {
    /** Renders a separator line instead of a clickable item. */
    separator?: boolean;
    label?: string;
    onClick?: () => void;
    disabled?: boolean;
    /** Shows a checkmark before the label (for toggleable items). */
    checked?: boolean;
}
export interface ContextMenuProps {
    items: ContextMenuItem[];
    position: {
        x: number;
        y: number;
    };
    onClose: () => void;
}
/**
 * Generic fixed-position context menu. Clamps itself to the viewport and
 * closes on outside pointer-down, Escape, scroll, or resize.
 */
export declare const ContextMenu: React.FC<ContextMenuProps>;
