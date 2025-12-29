/**
 * Utility functions for date manipulation
 */
/**
 * Creates a Date object from an ISO string
 * @param isoString The ISO date string
 * @returns A Date object
 */
export declare function fromISOString(isoString: string): Date;
/**
 * Creates a Date from a string (could be ISO or other formats)
 * @param dateString The date string
 * @returns A Date object
 */
export declare function fromDateString(dateString: string): Date;
/**
 * Creates a Date object from a Unix timestamp (seconds)
 * @param timestamp The Unix timestamp in seconds
 * @returns A Date object
 */
export declare function fromUnixTimestamp(timestamp: number): Date;
/**
 * Creates a Date object from a Unix timestamp in milliseconds
 * @param timestampMs The Unix timestamp in milliseconds
 * @returns A Date object
 */
export declare function fromUnixTimestampMs(timestampMs: number): Date;
/**
 * Checks if a value is a Date object
 * @param value The value to check
 * @returns True if the value is a Date object
 */
export declare function isDate(value: any): value is Date;
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
 * @returns The formatted date string
 */
export declare function formatDate(date: Date, format: string): string;
/**
 * A wrapper to print a date as a datetime string in the specified format.
 * @param date
 * @param format
 * @returns
 */
export declare function printDatetime(date: Date, format?: string): string;
/**
 * A wrapper to print a date as a short date string in the specified format.
 * @param date
 * @param format
 * @returns
 */
export declare function printDate(date: Date, format?: string): string;
