import { Dataset } from "./types";
/**
 * Converts a value to a Date object if it is a string or number.
 * @param value
 * @returns
 */
export declare function convertToDate(value: any): any;
/**
 * Processes a dataset to convert date columns to Date objects.
 * @param dataset
 */
export declare function processDatasetDates(dataset: Dataset): void;
/**
 * Find the column index in a dataset based on column name or index.
 * @param column
 * @param dataset
 * @returns
 */
export declare function findColumnIndex(column: string | number, dataset: Dataset): number | undefined;
/**
 * Normalizes a dataset's rows into records (objects keyed by column name).
 * Table-format rows (arrays) are mapped through `columns`; records-format
 * rows are returned as-is. Row objects are shared by reference where possible.
 */
export declare function toRecords(dataset: Dataset | undefined): Record<string, any>[];
/**
 * Decompresses all datasets in a record if they have compressedData.
 * @param datasets
 * @param shouldGC If true, deletes the compressedData property and clears the source script tag after decompression.
 * @returns
 */
export declare function decompressDatasets(datasets: Record<string, Dataset>, shouldGC?: boolean): Promise<Record<string, Dataset>>;
/**
 * Resolves derived datasets — datasets that declare a `source` (the id of
 * another dataset) plus an optional `filter` and/or `aggregate`. Chains of
 * derived datasets are resolved in dependency order; cycles and missing
 * sources are reported with a console warning and left unresolved (the
 * dataset keeps whatever `data` it declared, defaulting to empty).
 * @param datasets All datasets keyed by id.
 * @returns The same record with derived datasets materialized.
 */
export declare function resolveDerivedDatasets(datasets: Record<string, Dataset>): Record<string, Dataset>;
