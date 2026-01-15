import React from "react";
import { ReportVisual } from "../../lib/types";
import { type TemplateValue } from "../../lib/template-utility";
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
 * Card Component
 * A simple container for displaying text or HTML content, with support for template rendering.
 */
export declare const Card: React.FC<CardProps>;
