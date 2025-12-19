import React from "react";
import { Layout, LayoutElement } from "../lib/types"
import { PieChart } from "./visuals/PieChart";
import { Card } from "./visuals/Card";
import { Visual } from "./component-registry";

export interface PageRowProps {
    layout: Layout;
}

export const PageRow: React.FC<PageRowProps> = ({layout}) => {

    const renderChild = (child: LayoutElement, index: number) => {
        const childType = (typeof (child as any).type === 'string' ? (child as any).type : child.elementType) as string;

        if (childType === 'layout') {
            return <PageRow key={index} layout={child as Layout} />;
        }

        // For visual types, use the Visual component from the registry
        return <Visual key={index} {...(child as any)} type={childType} />;
    }
    return (
        <div 
            className="dl2-page-row"
            style={{ 
                flexDirection: layout.direction || 'row',
                flex: 1,
                padding: layout.padding || 0,
                margin: layout.margin || 0,
                border: layout.border ? "1px solid var(--dl2-border-main)" : undefined,
                boxShadow: layout.shadow ? "2px 2px 5px var(--dl2-shadow)" : undefined,
            }}
        >
            {layout.title && <h3 style={{width: '100%'}}>{layout.title}</h3>}
            {layout.children.map((child, index) => (
                renderChild(child, index)
            ))}
        </div>
    );
};