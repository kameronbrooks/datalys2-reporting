import React from "react";
import { Layout, LayoutElement } from "../lib/types"
import { PieChart } from "./visuals/PieChart";

export interface PageRowProps {
    layout: Layout;
}

export const PageRow: React.FC<PageRowProps> = ({layout}) => {

    const renderChild = (child: LayoutElement, index: number) => {
        switch (child.elementType) {
            case 'layout':
                return <PageRow key={index} layout={child as Layout} />;
            case 'pie':
                return <PieChart key={index} {...(child as any)} />;
            case 'barChart':
                return <></>;
            default:
                return <div key={index}>Unknown element type: {child.elementType}</div>;
        }
    }
    return (
        <div 
            className="dl2-page-row"
            style={{ 
                flexDirection: layout.direction || 'row',
                flex: 1
            }}
        >
            {layout.children.map((child, index) => (
                renderChild(child, index)
            ))}
        </div>
    );
};