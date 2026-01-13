/**
 * Decompresses a gzip-compressed base64 string and parses it as a JSON object.
 * Uses the built-in DecompressionStream API.
 * 
 * @param base64 The gzip-compressed base64 string.
 * @returns The decompressed JavaScript object.
 */
export async function decompressGzipB64ToObject<T = any>(base64: string): Promise<T> {
    // Decode base64 to Uint8Array
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    // Decompress using DecompressionStream
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        }
    }).pipeThrough(new DecompressionStream('gzip'));

    // Read the stream as text
    const response = new Response(stream);
    const text = await response.text();

    // Parse as JSON
    return JSON.parse(text) as T;
}

/**
 * Compresses a JavaScript object to a gzip-compressed base64 string.
 * Uses the built-in CompressionStream API.
 * 
 * @param obj The JavaScript object to compress.
 * @returns The gzip-compressed base64 string.
 */
export async function compressObjectToGzipB64(obj: any): Promise<string> {
    const jsonString = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(jsonString);

    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(bytes);
            controller.close();
        }
    }).pipeThrough(new CompressionStream('gzip'));

    const response = new Response(stream);
    const buffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.byteLength; i++) {
        binaryString += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binaryString);
}
