import { Dataset } from "./types"



/**
 * Find the column index in a dataset based on column name or index.
 * @param column 
 * @param dataset 
 * @returns 
 */
export function findColumnIndex(column: string | number, dataset: Dataset): number | undefined {
    if (!dataset) return undefined;
    if ((typeof column === "number") && (column >= 0) && (column < dataset.columns.length)) {
        return column;
    } else if (typeof column === "string") {
        const colIndex = dataset.columns.indexOf(column);
        return colIndex >= 0 ? colIndex : 0;
    }
    return undefined;
};