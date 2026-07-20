import React, { useContext } from "react";
import { LayoutElement } from "../../lib/types";
import { AppContext } from "../context/AppContext";

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
export const LinkVisual: React.FC<LinkVisualProps> = ({
    targetId,
    href,
    label,
    text,
    linkStyle = 'link',
    padding,
    margin,
    flex
}) => {
    const { navigateTo } = useContext(AppContext);
    const content = label || text || targetId || href || 'Link';
    const className = linkStyle === 'button' ? 'dl2-link-visual dl2-link-visual--button' : 'dl2-link-visual';
    const style: React.CSSProperties = {
        padding: padding ?? 0,
        margin: margin ?? 0,
        flex: flex ?? 0,
        alignSelf: 'center'
    };

    if (!targetId && !href) {
        return <span style={{ ...style, color: 'var(--dl2-error)' }}>Link visual needs a "targetId" or "href".</span>;
    }

    if (href && !targetId) {
        return (
            <a className={className} style={style} href={href} target="_blank" rel="noopener noreferrer">
                {content}
            </a>
        );
    }

    return (
        <a
            className={className}
            style={style}
            href={`#${targetId}`}
            onClick={(e) => {
                e.preventDefault();
                navigateTo(targetId!);
            }}
        >
            {content}
        </a>
    );
};
