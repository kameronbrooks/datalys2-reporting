import { Dataset } from "./types";
/**
 * Find the column index in a dataset based on column name or index.
 * @param column
 * @param dataset
 * @returns
 */
export declare function findColumnIndex(column: string | number, dataset: Dataset): number | undefined;
