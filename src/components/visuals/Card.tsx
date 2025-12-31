import React, { useContext, useMemo } from "react";
import { ReportVisual } from "../../lib/types";
import { AppContext } from "../context/AppContext";
import { renderTemplate, type TemplateValue } from "../../lib/template-utility";

/**
 * Props for the Card component.
 * Uses TemplateValue for text and title to allow dynamic data injection.
 */
export interface CardProps extends ReportVisual {
    /** The main content of the card. Can include template placeholders. */
    text: TemplateValue;
    /** Optional title for the card. Can include template placeholders. */
    title?: TemplateValue;
}

/**
 * Card Component
 * A simple container for displaying text or HTML content, with support for template rendering.
 */
export const Card: React.FC<CardProps> = ({ text, title, shadow, border, description, padding, margin }) => {
    const ctx = useContext(AppContext) || { datasets: {} };

    // Prepare context for template rendering, including all available datasets
    const templateCtx = useMemo(() => ({ datasets: ctx.datasets, props: {} }), [ctx.datasets]);

    // Render title template if provided
    const renderedTitle = useMemo(
        () => (title ? renderTemplate(title, templateCtx) : ""),
        [title, templateCtx]
    );

    // Render main text template
    const renderedText = useMemo(
        () => renderTemplate(text, templateCtx),
        [text, templateCtx]
    );

    return (
        <div className="dl2-card" style={{
            padding: padding || 10,
            margin: margin || 10,
            border: border ? '1px solid var(--dl2-border-main)' : undefined,
            boxShadow: shadow ? '2px 2px 5px var(--dl2-shadow)' : undefined,
            flex: 1,
            backgroundColor: 'var(--dl2-bg-visual)',
            color: 'var(--dl2-text-main)'
        }}>
            {title && <h2>{renderedTitle}</h2>}
            <p>{renderedText}</p>
        </div>
    );
}