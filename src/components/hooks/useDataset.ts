import { useContext, useMemo } from "react";
import { AppContext } from "../context/AppContext";
import { AggregateSpec, Dataset, FilterExpression } from "../../lib/types";
import { applyFilter } from "../../lib/filter-utility";
import { aggregateDataset } from "../../lib/aggregate-utility";

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
export function useDataset(
    datasetId: string,
    filter?: FilterExpression,
    aggregate?: AggregateSpec
): Dataset | undefined {
    const ctx = useContext(AppContext);
    const dataset = ctx.datasets[datasetId];

    return useMemo(() => {
        if (!dataset) return undefined;
        let ds = dataset;
        if (filter) ds = applyFilter(ds, filter);
        if (aggregate) ds = aggregateDataset(ds, aggregate);
        return ds;
    }, [dataset, filter, aggregate]);
}
