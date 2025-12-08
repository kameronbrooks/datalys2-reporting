import React from "react";
import { ReportVisual } from "../../lib/types";

export interface CardProps extends ReportVisual {
    text: string;
    title?: string;
}

export const Card: React.FC<CardProps> = ({ text, title, shadow, border, description }) => {
    return (
        <div className="dl2-card" style={{

        }}>
            {title && <h2>{title}</h2>}
            <p>{text}</p>
        </div>
    );
}