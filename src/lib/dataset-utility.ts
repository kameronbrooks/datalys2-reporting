import { Dataset } from "./types"
import { decompressGzipB64ToObject } from "./compression-utility";
import { fromISOString, fromUnixTimestamp, fromUnixTimestampMs } from "./date-utility";
import { applyFilter } from "./filter-utility";
import { aggregateDataset } from "./aggregate-utility";

/**
 * Converts a value to a Date object if it is a string or number.
 * @param value 
 * @returns 
 */
export function convertToDate(value: any): any {
    if (value === null || value === undefined || value === "") return value;

    if (typeof value === 'string') {
        const date = fromISOString(value);
        if (!isNaN(date.getTime())) {
            return date;
        }

        // Check if string is actually a numeric timestamp
        const numVal = Number(value);
        if (!isNaN(numVal) && value.trim() !== "") {
            // Heuristic for seconds vs ms
            if (numVal > 10000000000) {
                return fromUnixTimestampMs(numVal);
            } else {
                return fromUnixTimestamp(numVal);
            }
        }
        return value;
    } else if (typeof value === 'number') {
        // Heuristic: if it's a large number, it's likely ms, otherwise seconds
        if (value > 10000000000) {
            return fromUnixTimestampMs(value);
        } else {
            return fromUnixTimestamp(value);
        }
    }
    return value;
}

/**
 * Processes a dataset to convert date columns to Date objects.
 * @param dataset 
 */
export function processDatasetDates(dataset: Dataset): void {
    if (!dataset || !dataset.data || !dataset.dtypes || !Array.isArray(dataset.data)) return;

    const dateColumnIndices: number[] = [];
    dataset.dtypes.forEach((dtype, index) => {
        if (dtype === 'datetime' || dtype === 'date') {
            dateColumnIndices.push(index);
        }
    });

    if (dateColumnIndices.length === 0) return;

    if (dataset.format === 'table') {
        dataset.data.forEach((row: any) => {
            if (Array.isArray(row)) {
                dateColumnIndices.forEach(colIndex => {
                    row[colIndex] = convertToDate(row[colIndex]);
                });
            }
        });
    } else if (dataset.format === 'records' || dataset.format === 'record') {
        const dateColumnNames = dateColumnIndices.map(i => dataset.columns[i]);
        dataset.data.forEach((row: any) => {
            if (typeof row === 'object' && row !== null) {
                dateColumnNames.forEach(colName => {
                    row[colName] = convertToDate(row[colName]);
                });
            }
        });
    } else if (dataset.format === 'list') {
        if (dataset.dtypes[0] === 'datetime' || dataset.dtypes[0] === 'date') {
            dataset.data = dataset.data.map(val => convertToDate(val));
        }
    }
}

/**
 * Find the column index in a dataset based on column name or index.
 * @param column 
 * @param dataset 
 * @returns 
 */
export function findColumnIndex(column: string | number, dataset: Dataset): number | undefined {
    if (!dataset) return undefined;
    if (!dataset.columns) return undefined;

    if ((typeof column === "number") && (column >= 0) && (column < dataset.columns.length)) {
        return column;
    } else if (typeof column === "string") {
        const colIndex = dataset.columns.indexOf(column);
        return colIndex >= 0 ? colIndex : undefined;
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
        // Foolproofing: configs often omit the redundant inner `id` — fill it
        // from the record key so warnings and lookups can name the dataset.
        if (!dataset.id) dataset.id = id;
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
        
        // Process dates for all datasets, whether they were compressed or not
        try {
            processDatasetDates(dataset);
        }
        catch (error) {
            console.error(`Failed to process dates for dataset ${id}:`, error);
        }
    }

    return resolveDerivedDatasets(decompressedDatasets);
}

/**
 * Resolves derived datasets — datasets that declare a `source` (the id of
 * another dataset) plus an optional `filter` and/or `aggregate`. Chains of
 * derived datasets are resolved in dependency order; cycles and missing
 * sources are reported with a console warning and left unresolved (the
 * dataset keeps whatever `data` it declared, defaulting to empty).
 * @param datasets All datasets keyed by id.
 * @returns The same record with derived datasets materialized.
 */
export function resolveDerivedDatasets(datasets: Record<string, Dataset>): Record<string, Dataset> {
    const resolved: Record<string, Dataset> = { ...datasets };
    const state: Record<string, 'resolving' | 'done' | 'failed'> = {};

    const resolve = (id: string): boolean => {
        const dataset = resolved[id];
        if (!dataset) return false;
        if (state[id] === 'done') return true;
        if (state[id] === 'failed') return false;
        if (state[id] === 'resolving') {
            console.warn(`[datalys2] Derived dataset "${id}" is part of a circular "source" chain — left unresolved.`);
            state[id] = 'failed';
            return false;
        }

        if (!dataset.source) {
            state[id] = 'done';
            return true;
        }

        state[id] = 'resolving';
        const sourceOk = resolve(dataset.source);
        // The recursive call may have marked this id as failed (cycle).
        if ((state[id] as string) === 'failed') return false;

        if (!sourceOk) {
            console.warn(`[datalys2] Derived dataset "${id}": source dataset "${dataset.source}" could not be resolved.`);
            state[id] = 'failed';
            return false;
        }

        let derived: Dataset = {
            ...resolved[dataset.source],
            id,
            // derived output is materialized data, never re-decompressed
            compression: 'none',
            compressedData: undefined
        };
        if (dataset.filter) derived = applyFilter(derived, dataset.filter);
        if (dataset.aggregate) derived = aggregateDataset(derived, dataset.aggregate);
        resolved[id] = derived;
        state[id] = 'done';
        return true;
    };

    for (const id in resolved) {
        resolve(id);
    }
    return resolved;
}
