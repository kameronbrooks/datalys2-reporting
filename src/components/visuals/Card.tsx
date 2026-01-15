import React, { useContext, useMemo } from "react";
import { ReportVisual } from "../../lib/types";
import { AppContext } from "../context/AppContext";
import { renderTemplate, type TemplateValue } from "../../lib/template-utility";

/**
 * Content type for the card
 */
export type CardContentType = "text" | "html" | "md";

/**
 * Props for the Card component.
 * Uses TemplateValue for text and title to allow dynamic data injection.
 */
export interface CardProps extends ReportVisual {
    /** The main content of the card. Can include template placeholders. */
    text: TemplateValue;
    /** Optional title for the card. Can include template placeholders. */
    title?: TemplateValue;
    /** Content type for rendering (text, html, or markdown). Defaults to "text". */
    contentType?: CardContentType;
}

/**
 * Simple markdown to HTML converter for basic markdown features
 */
const markdownToHtml = (markdown: string): string => {
    let html = markdown;
    
    // Headers (process before line breaks)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold (must come before italic to handle ** before *)
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    
    return html;
};

/**
 * Card Component
 * A simple container for displaying text or HTML content, with support for template rendering.
 */
export const Card: React.FC<CardProps> = ({ text, title, shadow, border, description, padding, margin, contentType = "text" }) => {
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

    // Process content based on contentType
    const processedContent = useMemo(() => {
        if (contentType === "html") {
            return renderedText;
        } else if (contentType === "md") {
            return markdownToHtml(renderedText);
        }
        return renderedText;
    }, [renderedText, contentType]);

    // Render content based on type
    const renderContent = () => {
        if (contentType === "html" || contentType === "md") {
            return <div dangerouslySetInnerHTML={{ __html: processedContent }} />;
        }
        return <p>{processedContent}</p>;
    };

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
            {renderContent()}
        </div>
    );
}