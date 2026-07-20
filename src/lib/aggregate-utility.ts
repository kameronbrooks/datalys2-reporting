import { AggFn, AggregateColumn, AggregateSpec, Dataset } from "./types";
import { findColumnIndex } from "./dataset-utility";
import { isDate } from "./date-utility";

/**
 * Client-side grouping and aggregation of datasets.
 */

/**
 * Reads a cell from a row in either table (array) or records (object) format.
 */
function getCell(row: any, column: string | number, dataset: Dataset): any {
    if (Array.isArray(row)) {
        const index = findColumnIndex(column, dataset);
        return index === undefined ? undefined : row[index];
    }
    if (typeof column === 'number') {
        return row[dataset.columns?.[column]];
    }
    return row[column];
}

/**
 * Resolves the column name a column reference points at.
 */
function columnName(column: string | number, dataset: Dataset): string {
    if (typeof column === 'string') return column;
    return dataset.columns?.[column] ?? String(column);
}

/**
 * The output column name for an aggregate: `as` if given, else `${fn}_${column}`.
 */
export function aggregateOutputName(agg: AggregateColumn, dataset: Dataset): string {
    return agg.as ?? `${agg.fn}_${columnName(agg.column, dataset)}`;
}

function computeAggregate(values: any[], fn: AggFn): any {
    switch (fn) {
        case 'count':
            return values.length;
        case 'countDistinct': {
            const seen = new Set(values.map(v => isDate(v) ? (v as Date).getTime() : v));
            return seen.size;
        }
        case 'first':
            return values.length > 0 ? values[0] : null;
        case 'last':
            return values.length > 0 ? values[values.length - 1] : null;
    }

    // Numeric / date aggregates: ignore null/undefined/non-numeric values.
    const nums = values
        .map(v => isDate(v) ? (v as Date).getTime() : v)
        .filter(v => typeof v === 'number' && !isNaN(v));

    if (nums.length === 0) return null;

    switch (fn) {
        case 'sum': return nums.reduce((a, b) => a + b, 0);
        case 'avg': return nums.reduce((a, b) => a + b, 0) / nums.length;
        case 'min': return Math.min(...nums);
        case 'max': return Math.max(...nums);
        default:
            console.warn(`[datalys2] Unknown aggregate fn "${fn}".`);
            return null;
    }
}

/**
 * Computes a set of aggregates over an array of rows.
 * Returns a record keyed by the aggregate output name.
 * (Also used by the Table visual's grouped view.)
 */
export function computeAggregates(rows: any[], specs: AggregateColumn[], dataset: Dataset): Record<string, any> {
    const result: Record<string, any> = {};
    specs.forEach(spec => {
        const values = rows.map(row => getCell(row, spec.column, dataset));
        let value = computeAggregate(values, spec.fn);
        // min/max of date columns should stay dates
        if ((spec.fn === 'min' || spec.fn === 'max') && value !== null) {
            const index = findColumnIndex(spec.column, dataset);
            const dtype = index !== undefined ? dataset.dtypes?.[index] : undefined;
            if (dtype === 'date' || dtype === 'datetime') {
                value = new Date(value);
            }
        }
        result[aggregateOutputName(spec, dataset)] = value;
    });
    return result;
}

/**
 * Groups a dataset by the given columns and computes aggregates per group.
 * Produces a NEW records-format dataset with one row per group; group key
 * columns come first, followed by aggregate columns. The input dataset is
 * never mutated.
 *
 * Supports 'table' and 'records' formats; other formats are returned
 * unchanged with a console warning.
 */
export function aggregateDataset(dataset: Dataset, spec: AggregateSpec): Dataset {
    if (!dataset || !spec) return dataset;

    if (dataset.format !== 'table' && dataset.format !== 'records') {
        console.warn(`[datalys2] Aggregation is not supported for '${dataset.format}'-format dataset "${dataset.id}" — aggregate ignored.`);
        return dataset;
    }
    if (!Array.isArray(spec.groupBy) || spec.groupBy.length === 0 || !Array.isArray(spec.aggregates)) {
        console.warn(`[datalys2] Invalid aggregate spec for dataset "${dataset.id}" — aggregate ignored.`);
        return dataset;
    }

    const groupColumnNames = spec.groupBy.map(col => columnName(col, dataset));

    // Group rows preserving first-seen order
    const groups = new Map<string, { keyValues: any[]; rows: any[] }>();
    (dataset.data || []).forEach(row => {
        const keyValues = spec.groupBy.map(col => getCell(row, col, dataset));
        const key = JSON.stringify(keyValues.map(v => isDate(v) ? (v as Date).getTime() : v));
        let group = groups.get(key);
        if (!group) {
            group = { keyValues, rows: [] };
            groups.set(key, group);
        }
        group.rows.push(row);
    });

    const aggregateNames = spec.aggregates.map(agg => aggregateOutputName(agg, dataset));

    const data = Array.from(groups.values()).map(group => {
        const record: Record<string, any> = {};
        groupColumnNames.forEach((name, i) => {
            record[name] = group.keyValues[i];
        });
        Object.assign(record, computeAggregates(group.rows, spec.aggregates, dataset));
        return record;
    });

    // Build dtypes: group columns keep their source dtype; aggregates are
    // numeric except first/last (source dtype) and min/max of dates (datetime).
    const dtypes = [
        ...spec.groupBy.map(col => {
            const index = findColumnIndex(col, dataset);
            return index !== undefined ? (dataset.dtypes?.[index] ?? 'str') : 'str';
        }),
        ...spec.aggregates.map(agg => {
            const index = findColumnIndex(agg.column, dataset);
            const sourceDtype = index !== undefined ? (dataset.dtypes?.[index] ?? 'str') : 'str';
            if (agg.fn === 'first' || agg.fn === 'last') return sourceDtype;
            if ((agg.fn === 'min' || agg.fn === 'max') && (sourceDtype === 'date' || sourceDtype === 'datetime')) return sourceDtype;
            if (agg.fn === 'count' || agg.fn === 'countDistinct') return 'int';
            return 'float';
        })
    ];

    return {
        ...dataset,
        format: 'records',
        columns: [...groupColumnNames, ...aggregateNames],
        dtypes,
        data
    };
}
