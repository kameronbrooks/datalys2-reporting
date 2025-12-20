import { Dataset } from "./types";
/**
 * Find the column index in a dataset based on column name or index.
 * @param column
 * @param dataset
 * @returns
 */
export declare function findColumnIndex(column: string | number, dataset: Dataset): number | undefined;
/**
 * Decompresses all datasets in a record if they have compressedData.
 * @param datasets
 * @param shouldGC If true, deletes the compressedData property and clears the source script tag after decompression.
 * @returns
 */
export declare function decompressDatasets(datasets: Record<string, Dataset>, shouldGC?: boolean): Promise<Record<string, Dataset>>;
