import React from "react";
import { LayoutElement } from "../../lib/types";
export interface LinkVisualProps extends LayoutElement {
    /** Id of the visual to navigate to (switches page/tab and scrolls to it). */
    targetId?: string;
    /** External URL alternative — opens in a new tab. */
    href?: string;
    /** The link text. Falls back to `text`, then the target/href. */
    label?: string;
    text?: string;
    /** Render as an inline link (default) or a button. */
    linkStyle?: 'link' | 'button';
}
/**
 * A link that navigates to another visual in the document by its `id` —
 * switching to the containing page (and tab) and scrolling to it — or to an
 * external URL when `href` is used instead.
 */
export declare const LinkVisual: React.FC<LinkVisualProps>;
