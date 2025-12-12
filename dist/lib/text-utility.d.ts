/**
 * Options for formatting text.
 *
 * - maxLength: Maximum length of the text. If exceeded, text will be truncated with ellipsis.
 * - properCase: If true, converts text to proper case (first letter capitalized).
 * - replaceUnderscores: If true, replaces underscores with spaces.
 */
export interface TextFormatOptions {
    maxLength?: number;
    properCase?: boolean;
    replaceUnderscores?: boolean;
}
/**
 * Pretty prints text based on the provided options.
 *
 * @param text
 * @param options TextFormatOptions
 * @returns
 */
export declare function prettyPrintText(text: string, options?: TextFormatOptions): string;
