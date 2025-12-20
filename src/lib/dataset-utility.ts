import { Dataset } from "./types"
import { decompressGzipB64ToObject } from "./compression-utility";



/**
 * Find the column index in a dataset based on column name or index.
 * @param column 
 * @param dataset 
 * @returns 
 */
export function findColumnIndex(column: string | number, dataset: Dataset): number | undefined {
    if (!dataset) return undefined;
    if ((typeof column === "number") && (column >= 0) && (column < dataset.columns.length)) {
        return column;
    } else if (typeof column === "string") {
        const colIndex = dataset.columns.indexOf(column);
        return colIndex >= 0 ? colIndex : 0;
    }
    return undefined;
};

/**
 * Decompresses all datasets in a record if they have compressedData.
 * @param datasets 
 * @param shouldGC If true, deletes the compressedData property and clears the source script tag after decompression.
 * @returns 
 */
export async function decompressDatasets(datasets: Record<string, Dataset>, shouldGC: boolean = false): Promise<Record<string, Dataset>> {
    const decompressedDatasets = { ...datasets };

    for (const id in decompressedDatasets) {
        const dataset = decompressedDatasets[id];
        if (dataset.compressedData && dataset.compression === "gzip") {
            try {
                // compressedData is now the ID of the script tag
                const scriptElement = document.getElementById(dataset.compressedData);
                if (scriptElement) {
                    const b64Data = scriptElement.textContent || "";
                    if (b64Data) {
                        dataset.data = await decompressGzipB64ToObject(b64Data);
                        
                        if (shouldGC) {
                            // Clear the script tag content to save memory
                            scriptElement.textContent = "";
                            // Remove the reference to the ID
                            delete dataset.compressedData;
                            dataset.compression = "none";
                        }
                    }
                } else {
                    console.warn(`Compressed data script tag with ID "${dataset.compressedData}" not found for dataset ${id}`);
                }
            } catch (error) {
                console.error(`Failed to decompress dataset ${id}:`, error);
            }
        }
    }

    return decompressedDatasets;
}
