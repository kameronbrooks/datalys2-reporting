import { AggregateSpec, Dataset, FilterExpression } from "../../lib/types";
/**
 * Looks up a dataset from the app context, optionally applying a filter
 * and/or aggregate. Results are memoized.
 *
 * Note: visuals rendered through the registry already receive a filtered
 * view via DataScope; this hook is for components that need direct access.
 * @param datasetId The dataset id.
 * @param filter Optional filter expression.
 * @param aggregate Optional aggregate spec (applied after the filter).
 * @returns The (possibly transformed) dataset, or undefined if not found.
 */
export declare function useDataset(datasetId: string, filter?: FilterExpression, aggregate?: AggregateSpec): Dataset | undefined;
