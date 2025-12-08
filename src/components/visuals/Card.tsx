import React from "react";
import { ReportVisual } from "../../lib/types";

export interface CardProps extends ReportVisual {
    text: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ text, title, shadow, border, description, padding, margin }) => {
    return (
        <div className="dl2-card" style={{
            padding: padding || 10,
            margin: margin || 10,
            border: border ? '1px solid #ccc' : undefined,
            boxShadow: shadow ? '2px 2px 5px rgba(0, 0, 0, 0.1)' : undefined,
            flex: 1
        }}>
            {title && <h2>{title}</h2>}
            <p>{text}</p>
        </div>
    );
}