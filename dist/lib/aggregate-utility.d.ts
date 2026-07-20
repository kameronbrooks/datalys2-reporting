import { AggregateColumn, AggregateSpec, Dataset } from "./types";
/**
 * The output column name for an aggregate: `as` if given, else `${fn}_${column}`.
 */
export declare function aggregateOutputName(agg: AggregateColumn, dataset: Dataset): string;
/**
 * Computes a set of aggregates over an array of rows.
 * Returns a record keyed by the aggregate output name.
 * (Also used by the Table visual's grouped view.)
 */
export declare function computeAggregates(rows: any[], specs: AggregateColumn[], dataset: Dataset): Record<string, any>;
/**
 * Groups a dataset by the given columns and computes aggregates per group.
 * Produces a NEW records-format dataset with one row per group; group key
 * columns come first, followed by aggregate columns. The input dataset is
 * never mutated.
 *
 * Supports 'table' and 'records' formats; other formats are returned
 * unchanged with a console warning.
 */
export declare function aggregateDataset(dataset: Dataset, spec: AggregateSpec): Dataset;
