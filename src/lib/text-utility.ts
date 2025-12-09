

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
export function prettyPrintText(text: string, options: TextFormatOptions = {
    maxLength: -1,
    properCase: true,
    replaceUnderscores: true
}): string {
    let result = text;

    if (options.replaceUnderscores) {
        result = result.replace(/_/g, ' ');
    }
    if (options.properCase) {
        result = result.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
        });
    }
    if (options.maxLength && options.maxLength > 0 && result.length > options.maxLength) {
        result = result.substring(0, options.maxLength) + '...';
    }
    return result;
}