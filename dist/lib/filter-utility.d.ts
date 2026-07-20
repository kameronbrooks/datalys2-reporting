import { Dataset, FilterExpression } from "./types";
/**
 * Returns true when a row matches the filter expression.
 * @param row A row in table (array) or records (object) format.
 * @param filter The filter expression.
 * @param dataset The dataset the row belongs to (for column/dtype lookup).
 */
export declare function rowMatches(row: any, filter: FilterExpression, dataset: Dataset): boolean;
/**
 * Applies a filter to a dataset, returning a NEW dataset object with the
 * matching rows. Row objects/arrays are shared by reference (not cloned) and
 * the input dataset is never mutated.
 *
 * Supports 'table' and 'records' formats; 'list' and 'record' formats are
 * returned unchanged with a console warning.
 */
export declare function applyFilter(dataset: Dataset, filter: FilterExpression): Dataset;
