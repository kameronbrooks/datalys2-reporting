import React, { useContext } from "react";
import { Layout, LayoutElement, ReportModal } from "../lib/types"
import { Visual } from "./component-registry";
import { AppContext } from "./context/AppContext";
import { resolveElementKind } from "../lib/element-utility";

export interface PageRowProps {
    layout: Layout;
}

export const PageRow: React.FC<PageRowProps> = ({layout}) => {
    const { openModal } = useContext(AppContext);

    const renderChild = (child: LayoutElement, index: number) => {
        const resolved = resolveElementKind(child);
        let component;

        if (resolved.kind === 'layout') {
            component = <PageRow key={index} layout={child as Layout} />;
        } else if (resolved.kind === 'modal') {
            const modal = child as ReportModal;
            component = (
                <button
                    key={index}
                    className="dl2-modal-trigger-btn"
                    onClick={() => openModal(modal)}
                    style={{
                        padding: modal.padding ?? '10px 20px',
                        margin: modal.margin ?? '5px',
                        flex: modal.flex ?? 0
                    }}
                >
                    {modal.buttonLabel || modal.title || 'Open Modal'}
                </button>
            );
        } else {
            // For visual types, use the Visual component from the registry
            component = <Visual key={index} {...(child as any)} type={resolved.visualType} />;
        }

        if (child.modalId && resolved.kind !== 'modal') {
            return (
                <div key={index} className="dl2-element-wrapper" style={{ flex: child.flex ?? 1, display: 'flex' }}>
                    <button
                        className="dl2-modal-icon-trigger"
                        onClick={() => openModal(child.modalId!)}
                        title="View Details"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <polyline points="9 21 3 21 3 15"></polyline>
                            <line x1="21" y1="3" x2="14" y2="10"></line>
                            <line x1="3" y1="21" x2="10" y2="14"></line>
                        </svg>
                    </button>
                    {component}
                </div>
            );
        }

        return component;
    }

    const isGrid = layout.direction === 'grid';

    // Grid columns: fixed count by default, responsive auto-fit when
    // minChildWidth is provided.
    const minChildWidth = typeof layout.minChildWidth === 'number'
        ? `${layout.minChildWidth}px`
        : layout.minChildWidth;
    const gridTemplateColumns = isGrid
        ? (minChildWidth
            ? `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`
            : `repeat(${layout.columns || 3}, 1fr)`)
        : undefined;

    const contentStyle: React.CSSProperties = {
        display: isGrid ? 'grid' : 'flex',
        flexDirection: !isGrid ? ((layout.direction || 'row') as 'row' | 'column') : undefined,
        gridTemplateColumns,
        flexWrap: !isGrid && layout.wrap ? 'wrap' : undefined,
        alignItems: !isGrid ? layout.align : undefined,
        justifyContent: !isGrid ? layout.justify : undefined,
        gap: layout.gap ?? '10px',
        flex: layout.flex ?? 1,
        padding: layout.padding ?? 0,
        margin: layout.margin ?? 0,
        border: layout.border ? "1px solid var(--dl2-border-main)" : undefined,
        boxShadow: layout.shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
    };

    const content = (
        <div className="dl2-page-row" style={contentStyle}>
            {layout.children.map((child, index) => (
                renderChild(child, index)
            ))}
        </div>
    );

    if (!layout.title) {
        return content;
    }

    // With a title, render it above the content regardless of direction so
    // titles behave the same for row, column, and grid layouts.
    return (
        <div className="dl2-page-row-titled" style={{ flex: layout.flex ?? 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <h3 className='dl2-row-title'>{layout.title}</h3>
            {content}
        </div>
    );
};
