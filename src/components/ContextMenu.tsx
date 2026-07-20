import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

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
    position: { x: number; y: number };
    onClose: () => void;
}

/**
 * Generic fixed-position context menu. Clamps itself to the viewport and
 * closes on outside pointer-down, Escape, scroll, or resize.
 */
export const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [adjusted, setAdjusted] = useState(position);

    // Clamp to viewport once rendered
    useLayoutEffect(() => {
        const menu = menuRef.current;
        if (!menu) return;
        const rect = menu.getBoundingClientRect();
        let { x, y } = position;
        if (x + rect.width > window.innerWidth - 4) x = Math.max(4, window.innerWidth - rect.width - 4);
        if (y + rect.height > window.innerHeight - 4) y = Math.max(4, window.innerHeight - rect.height - 4);
        setAdjusted({ x, y });
    }, [position]);

    useEffect(() => {
        const handlePointerDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        const handleScrollOrResize = () => onClose();

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="dl2-context-menu"
            style={{ position: 'fixed', top: adjusted.y, left: adjusted.x, zIndex: 10000 }}
            onContextMenu={(e) => e.preventDefault()}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className="dl2-context-menu-separator" />;
                }
                return (
                    <div
                        key={index}
                        className={
                            "dl2-context-menu-item"
                            + (item.disabled ? " dl2-context-menu-item--disabled" : "")
                        }
                        onClick={() => {
                            if (item.disabled) return;
                            item.onClick?.();
                            onClose();
                        }}
                    >
                        <span className="dl2-context-menu-check">{item.checked ? '✓' : ''}</span>
                        {item.label}
                    </div>
                );
            })}
        </div>
    );
};
