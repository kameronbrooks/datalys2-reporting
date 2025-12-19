import * as d3 from "d3";
import { ColorProperty } from "./types";

/**
 * Resolves a ColorProperty into an array of color strings.
 * If the property is a d3 scheme name, it returns the colors from that scheme.
 * If it's a single color string, it returns an array with that single color.
 * If it's already an array, it returns it as is.
 * 
 * @param color The color property to resolve
 * @returns An array of color strings
 */
export function resolveColors(color: ColorProperty | undefined): string[] {
    if (!color) return [];
    
    if (Array.isArray(color)) {
        return color;
    }
    
    // Try to find a d3 scheme with this name
    // d3-scale-chromatic schemes are usually named like schemeCategory10, schemeTableau10, etc.
    const d3Any = d3 as any;
    
    // Check for exact match (e.g. "schemeCategory10")
    if (d3Any[color]) {
        const val = d3Any[color];
        if (Array.isArray(val)) {
            // If it's an array of arrays (like schemeBlues), pick the largest one
            if (Array.isArray(val[val.length - 1])) {
                return val[val.length - 1];
            }
            return val;
        }
        if (typeof val === 'function') {
            return Array.from({ length: 10 }, (_, i) => val(i / 9));
        }
    }
    
    // Check for match without "scheme" prefix (e.g. "Category10")
    const schemeName = "scheme" + color.charAt(0).toUpperCase() + color.slice(1);
    if (d3Any[schemeName]) {
        const val = d3Any[schemeName];
        if (Array.isArray(val)) {
            // If it's an array of arrays (like schemeBlues), pick the largest one
            if (Array.isArray(val[val.length - 1])) {
                return val[val.length - 1];
            }
            return val;
        }
    }

    // Check for interpolators (cyclical/sequential) and create a discrete version
    const interpolatorName = "interpolate" + color.charAt(0).toUpperCase() + color.slice(1);
    if (typeof d3Any[interpolatorName] === 'function') {
        const interpolator = d3Any[interpolatorName];
        // Create a 10-color discrete version of the interpolator
        return Array.from({ length: 10 }, (_, i) => interpolator(i / 9));
    }

    // Check for common lowercase names
    const commonSchemes: Record<string, string[]> = {
        "tableau10": d3.schemeTableau10 as string[],
        "category10": d3.schemeCategory10 as string[],
        "accent": d3.schemeAccent as string[],
        "dark2": d3.schemeDark2 as string[],
        "paired": d3.schemePaired as string[],
        "pastel1": d3.schemePastel1 as string[],
        "pastel2": d3.schemePastel2 as string[],
        "set1": d3.schemeSet1 as string[],
        "set2": d3.schemeSet2 as string[],
        "set3": d3.schemeSet3 as string[],
        "viridis": Array.from({ length: 10 }, (_, i) => d3.interpolateViridis(i / 9)),
        "inferno": Array.from({ length: 10 }, (_, i) => d3.interpolateInferno(i / 9)),
        "magma": Array.from({ length: 10 }, (_, i) => d3.interpolateMagma(i / 9)),
        "plasma": Array.from({ length: 10 }, (_, i) => d3.interpolatePlasma(i / 9)),
        "warm": Array.from({ length: 10 }, (_, i) => d3.interpolateWarm(i / 9)),
        "cool": Array.from({ length: 10 }, (_, i) => d3.interpolateCool(i / 9)),
        "rainbow": Array.from({ length: 10 }, (_, i) => d3.interpolateRainbow(i / 9)),
        "sinebow": Array.from({ length: 10 }, (_, i) => d3.interpolateSinebow(i / 9))
    };

    if (commonSchemes[color.toLowerCase()]) {
        return commonSchemes[color.toLowerCase()];
    }
    
    // Otherwise it's a single color
    return [color];
}

/**
 * Resolves a ColorProperty into an interpolator function (t: number) => string.
 * Useful for heatmaps and continuous scales.
 * 
 * @param color The color property to resolve
 * @returns An interpolator function
 */
export function resolveInterpolator(color: ColorProperty | undefined): (t: number) => string {
    const d3Any = d3 as any;
    const defaultInterpolator = d3.interpolateYlOrRd;

    if (!color) return defaultInterpolator;

    if (Array.isArray(color)) {
        return d3.interpolateRgbBasis(color);
    }

    // Check for exact match (e.g. "interpolateViridis")
    if (typeof d3Any[color] === 'function') {
        return d3Any[color];
    }

    // Check for match without "interpolate" prefix (e.g. "Viridis")
    const interpolatorName = "interpolate" + color.charAt(0).toUpperCase() + color.slice(1);
    if (typeof d3Any[interpolatorName] === 'function') {
        return d3Any[interpolatorName];
    }

    // Check for schemes that can be converted to interpolators
    const schemeName = color.startsWith("scheme") ? color : "scheme" + color.charAt(0).toUpperCase() + color.slice(1);
    if (d3Any[schemeName]) {
        const val = d3Any[schemeName];
        if (Array.isArray(val)) {
            const colors = Array.isArray(val[val.length - 1]) ? val[val.length - 1] : val;
            return d3.interpolateRgbBasis(colors);
        }
    }

    // Fallback to single color interpolation (from white to color)
    try {
        return d3.interpolateRgb("white", color);
    } catch (e) {
        return defaultInterpolator;
    }
}

/**
 * Gets a color from a resolved array of colors using modulo-based indexing.
 * 
 * @param colors Array of color strings
 * @param index The index of the element
 * @param defaultColor Color to return if the array is empty
 * @returns A color string
 */
export function getColor(colors: string[], index: number, defaultColor: string = "#69b3a2"): string {
    if (!colors || colors.length === 0) return defaultColor;
    return colors[index % colors.length];
}
