/**
 * Decompresses a gzip-compressed base64 string and parses it as a JSON object.
 * Uses the built-in DecompressionStream API.
 *
 * @param base64 The gzip-compressed base64 string.
 * @returns The decompressed JavaScript object.
 */
export declare function decompressGzipB64ToObject<T = any>(base64: string): Promise<T>;
/**
 * Compresses a JavaScript object to a gzip-compressed base64 string.
 * Uses the built-in CompressionStream API.
 *
 * @param obj The JavaScript object to compress.
 * @returns The gzip-compressed base64 string.
 */
export declare function compressObjectToGzipB64(obj: any): Promise<string>;
