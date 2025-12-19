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
export declare function resolveColors(color: ColorProperty | undefined): string[];
/**
 * Resolves a ColorProperty into an interpolator function (t: number) => string.
 * Useful for heatmaps and continuous scales.
 *
 * @param color The color property to resolve
 * @returns An interpolator function
 */
export declare function resolveInterpolator(color: ColorProperty | undefined): (t: number) => string;
/**
 * Gets a color from a resolved array of colors using modulo-based indexing.
 *
 * @param colors Array of color strings
 * @param index The index of the element
 * @param defaultColor Color to return if the array is empty
 * @returns A color string
 */
export declare function getColor(colors: string[], index: number, defaultColor?: string): string;
