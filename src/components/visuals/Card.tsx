import React, { useContext, useMemo } from "react";
import { ReportVisual } from "../../lib/types";
import { AppContext } from "../context/AppContext";
import { renderTemplate, type TemplateValue } from "../../lib/template-utility";

export interface CardProps extends ReportVisual {
    text: TemplateValue;
    title?: TemplateValue;
}

export const Card: React.FC<CardProps> = ({ text, title, shadow, border, description, padding, margin }) => {
    const ctx = useContext(AppContext) || { datasets: {} };

    const templateCtx = useMemo(() => ({ datasets: ctx.datasets, props: {} }), [ctx.datasets]);

    const renderedTitle = useMemo(
        () => (title ? renderTemplate(title, templateCtx) : ""),
        [title, templateCtx]
    );

    const renderedText = useMemo(
        () => renderTemplate(text, templateCtx),
        [text, templateCtx]
    );

    return (
        <div className="dl2-card" style={{
            padding: padding || 10,
            margin: margin || 10,
            border: border ? '1px solid #ccc' : undefined,
            boxShadow: shadow ? '2px 2px 5px rgba(0, 0, 0, 0.1)' : undefined,
            flex: 1
        }}>
            {title && <h2>{renderedTitle}</h2>}
            <p>{renderedText}</p>
        </div>
    );
}