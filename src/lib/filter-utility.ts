import { Dataset, FilterCondition, FilterExpression, FilterGroup } from "./types";
import { convertToDate, findColumnIndex } from "./dataset-utility";
import { isDate } from "./date-utility";

/**
 * Client-side dataset filtering.
 *
 * A FilterExpression is either a single condition:
 *   { "column": "region", "op": "eq", "value": "West" }
 * or a boolean composition:
 *   { "and": [ ...expressions ] }
 *   { "or":  [ ...expressions ] }
 *   { "not": expression }
 *
 * See FilterOp in types.ts for the operator list.
 */

function isFilterGroup(filter: FilterExpression): filter is FilterGroup {
    const f = filter as FilterGroup;
    return Array.isArray(f.and) || Array.isArray(f.or) || f.not !== undefined;
}

/**
 * Returns a comparable primitive for a value: Dates become epoch millis,
 * everything else is returned as-is.
 */
function comparable(value: any): any {
    return isDate(value) ? (value as Date).getTime() : value;
}

/**
 * Coerces a filter value so it can be compared against a column value.
 * If the column holds Dates (dtype date/datetime), string/number filter
 * values are converted to Dates using the same rules as dataset loading.
 */
function coerceFilterValue(value: any, isDateColumn: boolean): any {
    if (!isDateColumn) return value;
    if (isDate(value)) return value;
    return convertToDate(value);
}

/**
 * Evaluates a single condition against a cell value.
 */
function evaluateCondition(cellValue: any, condition: FilterCondition, isDateColumn: boolean): boolean {
    const op = condition.op;

    if (op === 'isNull') {
        return cellValue === null || cellValue === undefined || cellValue === '';
    }
    if (op === 'notNull') {
        return !(cellValue === null || cellValue === undefined || cellValue === '');
    }

    const cell = comparable(cellValue);

    if (op === 'in' || op === 'nin') {
        const rawList = condition.values ?? (Array.isArray(condition.value) ? condition.value : [condition.value]);
        const list = rawList.map(v => comparable(coerceFilterValue(v, isDateColumn)));
        const found = list.some(v => v === cell);
        return op === 'in' ? found : !found;
    }

    if (op === 'between') {
        const range = condition.values ?? condition.value;
        if (!Array.isArray(range) || range.length < 2) return false;
        const low = comparable(coerceFilterValue(range[0], isDateColumn));
        const high = comparable(coerceFilterValue(range[1], isDateColumn));
        return cell !== null && cell !== undefined && cell >= low && cell <= high;
    }

    if (op === 'contains' || op === 'startsWith' || op === 'endsWith') {
        if (cellValue === null || cellValue === undefined) return false;
        const haystack = String(cellValue).toLowerCase();
        const needle = String(condition.value ?? '').toLowerCase();
        if (op === 'contains') return haystack.includes(needle);
        if (op === 'startsWith') return haystack.startsWith(needle);
        return haystack.endsWith(needle);
    }

    const value = comparable(coerceFilterValue(condition.value, isDateColumn));

    switch (op) {
        case 'eq': return cell === value;
        case 'neq': return cell !== value;
        case 'gt': return cell !== null && cell !== undefined && cell > value;
        case 'gte': return cell !== null && cell !== undefined && cell >= value;
        case 'lt': return cell !== null && cell !== undefined && cell < value;
        case 'lte': return cell !== null && cell !== undefined && cell <= value;
        default:
            console.warn(`[datalys2] Unknown filter op "${op}" — condition treated as non-matching.`);
            return false;
    }
}

/**
 * Reads a cell from a row in either table (array) or records (object) format.
 */
function getCell(row: any, condition: FilterCondition, dataset: Dataset): any {
    if (Array.isArray(row)) {
        const index = findColumnIndex(condition.column, dataset);
        return index === undefined ? undefined : row[index];
    }
    if (typeof condition.column === 'number') {
        return row[dataset.columns?.[condition.column]];
    }
    return row[condition.column];
}

function isDateColumnFor(condition: FilterCondition, dataset: Dataset): boolean {
    const index = findColumnIndex(condition.column, dataset);
    if (index === undefined || !dataset.dtypes) return false;
    const dtype = dataset.dtypes[index];
    return dtype === 'date' || dtype === 'datetime';
}

/**
 * Returns true when a row matches the filter expression.
 * @param row A row in table (array) or records (object) format.
 * @param filter The filter expression.
 * @param dataset The dataset the row belongs to (for column/dtype lookup).
 */
export function rowMatches(row: any, filter: FilterExpression, dataset: Dataset): boolean {
    if (isFilterGroup(filter)) {
        if (filter.and) return filter.and.every(f => rowMatches(row, f, dataset));
        if (filter.or) return filter.or.some(f => rowMatches(row, f, dataset));
        if (filter.not) return !rowMatches(row, filter.not, dataset);
        return true;
    }
    const condition = filter as FilterCondition;
    return evaluateCondition(getCell(row, condition, dataset), condition, isDateColumnFor(condition, dataset));
}

/**
 * Applies a filter to a dataset, returning a NEW dataset object with the
 * matching rows. Row objects/arrays are shared by reference (not cloned) and
 * the input dataset is never mutated.
 *
 * Supports 'table' and 'records' formats; 'list' and 'record' formats are
 * returned unchanged with a console warning.
 */
export function applyFilter(dataset: Dataset, filter: FilterExpression): Dataset {
    if (!dataset || !filter) return dataset;

    if (dataset.format !== 'table' && dataset.format !== 'records') {
        console.warn(`[datalys2] Filtering is not supported for '${dataset.format}'-format dataset "${dataset.id}" — filter ignored.`);
        return dataset;
    }

    const data = (dataset.data || []).filter(row => rowMatches(row, filter, dataset));
    return { ...dataset, data };
}
