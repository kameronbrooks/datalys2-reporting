import { LayoutElement } from "./types";

/**
 * The structural kind of a layout child element.
 */
export type ElementKind = 'layout' | 'modal' | 'visual';

export interface ResolvedElement {
    kind: ElementKind;
    /** The registry key for the visual when kind === 'visual'. */
    visualType?: string;
}

/**
 * Resolves the structural kind of a config element.
 *
 * Configs in the wild use several conventions:
 * - `"type": "card"` alone (most common)
 * - `"elementType": "visual"` plus `"type": "gauge"`
 * - bare `"elementType": "pie"` with no `type`
 * - nested layouts as `"type": "layout"` with a `children` array
 *
 * Precedence matches the historical behavior: a string `type` wins over
 * `elementType`. As a foolproofing measure, an untyped object that carries a
 * `children` array is treated as a layout instead of failing with
 * "Unknown component type".
 * @param el
 * @returns
 */
export function resolveElementKind(el: LayoutElement): ResolvedElement {
    const raw = typeof (el as any).type === 'string' ? (el as any).type : el.elementType;

    if (raw === 'layout') return { kind: 'layout' };
    if (raw === 'modal') return { kind: 'modal' };

    // Untyped (or generically-typed) object with children: treat as a layout.
    if ((raw === undefined || raw === 'visual') && Array.isArray((el as any).children)) {
        return { kind: 'layout' };
    }

    return { kind: 'visual', visualType: raw ?? (el as any).visualType };
}
