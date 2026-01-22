/**
 * Utility functions for date manipulation
 */

/**
 * Creates a Date object from an ISO string
 * @param isoString The ISO date string
 * @returns A Date object
 */
export function fromISOString(isoString: string): Date {
    return new Date(isoString);
}

/**
 * Creates a Date from a string (could be ISO or other formats)
 * @param dateString The date string
 * @returns A Date object
 */
export function fromDateString(dateString: string): Date {
    return new Date(dateString);
}

/**
 * Creates a Date object from a Unix timestamp (seconds)
 * @param timestamp The Unix timestamp in seconds
 * @returns A Date object
 */
export function fromUnixTimestamp(timestamp: number): Date {
    return new Date(timestamp * 1000);
}

/**
 * Creates a Date object from a Unix timestamp in milliseconds
 * @param timestampMs The Unix timestamp in milliseconds
 * @returns A Date object
 */
export function fromUnixTimestampMs(timestampMs: number): Date {
    return new Date(timestampMs);
}

/**
 * Checks if a value is a Date object
 * @param value The value to check
 * @returns True if the value is a Date object
 */
export function isDate(value: any): value is Date {
    return value instanceof Date && !isNaN(value.getTime());
}

/** Formats a Date based on the provided format string.
 * Supported tokens:
 * YYYY - 4-digit year
 * MM - 2-digit month (01-12)
 * DD - 2-digit day of month (01-31)
 * hh - 2-digit hour (00-23)
 * mm - 2-digit minute (00-59)
 * ss - 2-digit second (00-59)
 * @param date The Date object to format
 * @param format The format string
 * @param useUTC If true, formats in UTC time; otherwise uses local time (default: false)
 * @returns The formatted date string
 */
export function formatDate(date: Date, format: string, useUTC: boolean = false): string {
    const pad = (num: number, size: number) => {
        let s = num.toString();
        while (s.length < size) s = "0" + s;
        return s;
    }

    return format.replace(/YYYY|MM|DD|hh|mm|ss/g, (match) => {
        switch (match) {
            case 'YYYY': return useUTC ? date.getUTCFullYear().toString() : date.getFullYear().toString();
            case 'MM': return pad(useUTC ? date.getUTCMonth() + 1 : date.getMonth() + 1, 2);
            case 'DD': return pad(useUTC ? date.getUTCDate() : date.getDate(), 2);
            case 'hh': return pad(useUTC ? date.getUTCHours() : date.getHours(), 2);
            case 'mm': return pad(useUTC ? date.getUTCMinutes() : date.getMinutes(), 2);
            case 'ss': return pad(useUTC ? date.getUTCSeconds() : date.getSeconds(), 2);
            default: return match;
        }
    });
}

/**
 * A wrapper to print a date as a datetime string in the specified format.
 * @param date 
 * @param format 
 * @param useUTC If true, formats in UTC time; otherwise uses local time (default: false)
 * @returns 
 */
export function printDatetime(date: Date, format: string = 'YYYY-MM-DD hh:mm:ss', useUTC: boolean = false): string {
    return formatDate(date, format, useUTC);
}

/**
 * A wrapper to print a date as a short date string in the specified format.
 * @param date 
 * @param format 
 * @param useUTC If true, formats in UTC time; otherwise uses local time (default: false)
 * @returns 
 */
export function printDate(date: Date, format: string = 'YYYY-MM-DD', useUTC: boolean = false): string {
    return formatDate(date, format, useUTC);
}

