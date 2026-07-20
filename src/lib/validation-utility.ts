import { ApplicationData, Dataset, Layout, LayoutElement } from "./types";
import { resolveElementKind } from "./element-utility";
import { findPageIndexForTarget } from "./navigation-utility";

/**
 * Information the validator needs about the visual registry.
 */
export interface ValidationRegistryInfo {
    /** All registered visual type keys (e.g. 'table', 'pie', ...). */
    knownVisualTypes: string[];
    /** Visual types that do not require a datasetId (e.g. 'card', 'tabs'). */
    datasetlessTypes: string[];
}

const WARN_PREFIX = '[datalys2]';

function warn(message: string): void {
    console.warn(`${WARN_PREFIX} ${message}`);
}

/**
 * Describes where in the config tree an element lives, for readable warnings.
 */
function describeElement(el: any, path: string): string {
    const id = el && el.id ? ` (id: "${el.id}")` : '';
    return `${path}${id}`;
}

/**
 * Validates a filter expression shape (ops are checked loosely so new ops
 * added to filter-utility don't require a validator update to avoid warnings).
 */
const KNOWN_FILTER_OPS = [
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin',
    'contains', 'startsWith', 'endsWith', 'between', 'isNull', 'notNull'
];
const KNOWN_AGG_FNS = ['sum', 'avg', 'min', 'max', 'count', 'countDistinct', 'first', 'last'];

function validateFilterExpression(filter: any, dataset: Dataset | undefined, path: string): void {
    if (!filter || typeof filter !== 'object') {
        warn(`${path}: filter must be an object.`);
        return;
    }
    if (filter.and || filter.or) {
        const list = filter.and || filter.or;
        if (!Array.isArray(list)) {
            warn(`${path}: filter "${filter.and ? 'and' : 'or'}" must be an array.`);
            return;
        }
        list.forEach((sub: any, i: number) => validateFilterExpression(sub, dataset, `${path}.${filter.and ? 'and' : 'or'}[${i}]`));
        return;
    }
    if (filter.not) {
        validateFilterExpression(filter.not, dataset, `${path}.not`);
        return;
    }
    // Leaf condition
    if (filter.column === undefined) {
        warn(`${path}: filter condition is missing "column".`);
    } else if (dataset && typeof filter.column === 'string' && dataset.columns && !dataset.columns.includes(filter.column)) {
        warn(`${path}: filter references column "${filter.column}" which is not in dataset "${dataset.id}" (columns: ${dataset.columns.join(', ')}).`);
    }
    if (filter.op === undefined) {
        warn(`${path}: filter condition is missing "op". Valid ops: ${KNOWN_FILTER_OPS.join(', ')}.`);
    } else if (!KNOWN_FILTER_OPS.includes(filter.op)) {
        warn(`${path}: unknown filter op "${filter.op}". Valid ops: ${KNOWN_FILTER_OPS.join(', ')}.`);
    }
}

function validateAggregateSpec(aggregate: any, dataset: Dataset | undefined, path: string): void {
    if (!aggregate || typeof aggregate !== 'object') {
        warn(`${path}: aggregate must be an object.`);
        return;
    }
    if (!Array.isArray(aggregate.groupBy) || aggregate.groupBy.length === 0) {
        warn(`${path}: aggregate is missing a non-empty "groupBy" array.`);
    } else if (dataset && dataset.columns) {
        aggregate.groupBy.forEach((col: any) => {
            if (typeof col === 'string' && !dataset.columns.includes(col)) {
                warn(`${path}: aggregate groupBy column "${col}" is not in dataset "${dataset.id}".`);
            }
        });
    }
    if (!Array.isArray(aggregate.aggregates)) {
        warn(`${path}: aggregate is missing an "aggregates" array.`);
    } else {
        aggregate.aggregates.forEach((agg: any, i: number) => {
            if (agg.fn && !KNOWN_AGG_FNS.includes(agg.fn)) {
                warn(`${path}.aggregates[${i}]: unknown aggregate fn "${agg.fn}". Valid fns: ${KNOWN_AGG_FNS.join(', ')}.`);
            }
            if (dataset && dataset.columns && typeof agg.column === 'string' && !dataset.columns.includes(agg.column) && agg.fn !== 'count') {
                warn(`${path}.aggregates[${i}]: column "${agg.column}" is not in dataset "${dataset.id}".`);
            }
        });
    }
}

function validateElement(
    el: LayoutElement,
    data: ApplicationData,
    registry: ValidationRegistryInfo,
    path: string
): void {
    if (!el || typeof el !== 'object') {
        warn(`${path}: element is not an object.`);
        return;
    }

    const resolved = resolveElementKind(el);

    if (resolved.kind === 'layout') {
        const layout = el as Layout;
        if (!Array.isArray(layout.children) || layout.children.length === 0) {
            warn(`${describeElement(el, path)}: layout has no children.`);
            return;
        }
        if (layout.direction && !['row', 'column', 'grid'].includes(layout.direction)) {
            warn(`${describeElement(el, path)}: unknown layout direction "${layout.direction}" (expected row, column, or grid).`);
        }
        layout.children.forEach((child, i) => validateElement(child, data, registry, `${path}.children[${i}]`));
        return;
    }

    if (resolved.kind === 'modal') {
        const modalId = (el as any).id;
        if (modalId && data.modals && !data.modals.some(m => m.id === modalId) && (el as any).rows === undefined) {
            warn(`${describeElement(el, path)}: modal trigger references modal "${modalId}" which is not defined in "modals".`);
        }
        return;
    }

    // Visual
    const visualType = resolved.visualType;
    const desc = describeElement(el, path);
    if (!visualType) {
        warn(`${desc}: element has no "type". Add e.g. "type": "table".`);
        return;
    }
    if (!registry.knownVisualTypes.includes(visualType)) {
        warn(`${desc}: unknown visual type "${visualType}". Known types: ${registry.knownVisualTypes.join(', ')}.`);
        return;
    }

    const anyEl = el as any;
    const needsDataset = !registry.datasetlessTypes.includes(visualType);
    const dataset: Dataset | undefined = anyEl.datasetId ? data.datasets?.[anyEl.datasetId] : undefined;

    if (needsDataset) {
        if (!anyEl.datasetId) {
            warn(`${desc}: visual "${visualType}" is missing "datasetId".`);
        } else if (data.datasets && !data.datasets[anyEl.datasetId]) {
            warn(`${desc}: datasetId "${anyEl.datasetId}" not found. Available datasets: ${Object.keys(data.datasets).join(', ') || '(none)'}.`);
        }
    }

    if (anyEl.filter) validateFilterExpression(anyEl.filter, dataset, `${desc}.filter`);
    if (anyEl.aggregate) validateAggregateSpec(anyEl.aggregate, dataset, `${desc}.aggregate`);

    if (anyEl.rowModalId && !(data.modals || []).some(m => m.id === anyEl.rowModalId)) {
        warn(`${desc}: rowModalId "${anyEl.rowModalId}" is not defined in "modals".`);
    }

    if (visualType === 'link') {
        if (!anyEl.targetId && !anyEl.href) {
            warn(`${desc}: link visual needs a "targetId" (visual id) or "href" (external URL).`);
        } else if (anyEl.targetId && findPageIndexForTarget(data.pages || [], anyEl.targetId) < 0) {
            warn(`${desc}: link targetId "${anyEl.targetId}" does not match any visual id in the report.`);
        }
    }

    // Column-name references common across visuals
    const columnProps = ['xColumn', 'yColumn', 'valueColumn', 'labelColumn', 'categoryColumn', 'groupBy'];
    // Note: when filter/aggregate is present the effective columns may differ
    // (aggregates emit renamed columns), so skip column checks in that case.
    if (dataset && dataset.columns && !anyEl.aggregate) {
        columnProps.forEach(prop => {
            const val = anyEl[prop];
            if (typeof val === 'string' && val.length > 0 && !dataset.columns.includes(val)) {
                warn(`${desc}: ${prop} "${val}" is not a column of dataset "${dataset.id}" (columns: ${dataset.columns.join(', ')}).`);
            }
        });
        const columnListProps = ['yColumns', 'columns', 'hiddenColumns', 'rowModalColumns'];
        columnListProps.forEach(prop => {
            const val = anyEl[prop];
            if (Array.isArray(val)) {
                val.forEach((col: any) => {
                    if (typeof col === 'string' && !dataset.columns.includes(col)) {
                        warn(`${desc}: ${prop} entry "${col}" is not a column of dataset "${dataset.id}".`);
                    }
                });
            }
        });
    }

    // Tabs container: validate children recursively
    if ((visualType === 'tabs' || visualType === 'tabgroup')) {
        if (!Array.isArray(anyEl.tabs) || anyEl.tabs.length === 0) {
            warn(`${desc}: tabs visual is missing a non-empty "tabs" array.`);
        } else {
            anyEl.tabs.forEach((tab: any, i: number) => {
                if (!tab || typeof tab !== 'object') {
                    warn(`${desc}.tabs[${i}]: tab must be an object with a "title" and "children" or "layout".`);
                    return;
                }
                if (tab.layout) {
                    validateElement({ ...tab.layout, type: 'layout' } as any, data, registry, `${desc}.tabs[${i}].layout`);
                } else if (Array.isArray(tab.children)) {
                    tab.children.forEach((child: any, j: number) => validateElement(child, data, registry, `${desc}.tabs[${i}].children[${j}]`));
                } else {
                    warn(`${desc}.tabs[${i}] ("${tab.title || 'untitled'}"): tab has no "children" or "layout".`);
                }
            });
        }
    }
}

/**
 * Validates derived dataset definitions (datasets with a "source").
 */
function validateDatasets(data: ApplicationData): void {
    const datasets = data.datasets || {};
    for (const id in datasets) {
        const ds: any = datasets[id];
        if (ds.source) {
            const sourceDs = datasets[ds.source];
            if (!sourceDs) {
                warn(`Dataset "${id}": source dataset "${ds.source}" not found.`);
            }
            if (ds.filter) validateFilterExpression(ds.filter, sourceDs, `dataset "${id}".filter`);
            if (ds.aggregate) validateAggregateSpec(ds.aggregate, sourceDs, `dataset "${id}".aggregate`);
        }
    }
}

/**
 * Walks the parsed application data and emits console warnings for common
 * config mistakes: unknown visual types, missing datasets, bad column names,
 * empty layouts, malformed filters, etc.
 *
 * Warnings only — never throws and never blocks rendering.
 * @param data The parsed report config.
 * @param registry Known visual types and which of them need no dataset.
 */
export function validateAppData(data: ApplicationData, registry: ValidationRegistryInfo): void {
    try {
        if (!data || typeof data !== 'object') {
            warn('Report data is empty or not an object.');
            return;
        }
        if (!Array.isArray(data.pages) || data.pages.length === 0) {
            warn('Report has no pages.');
        }

        validateDatasets(data);

        // Duplicate visual ids break anchors and view-state persistence.
        const idCounts = new Map<string, number>();
        const collectIds = (node: any): void => {
            if (!node || typeof node !== 'object') return;
            // Count visuals only — modal triggers intentionally repeat modal ids.
            if (typeof node.id === 'string' && node.id && resolveElementKind(node).kind === 'visual') {
                idCounts.set(node.id, (idCounts.get(node.id) || 0) + 1);
            }
            if (Array.isArray(node.children)) node.children.forEach(collectIds);
            if (Array.isArray(node.tabs)) node.tabs.forEach((tab: any) => {
                if (tab?.layout) collectIds(tab.layout);
                if (Array.isArray(tab?.children)) tab.children.forEach(collectIds);
            });
        };
        (data.pages || []).forEach(page => (page.rows || []).forEach(collectIds));
        idCounts.forEach((count, id) => {
            if (count > 1) {
                warn(`Visual id "${id}" is used ${count} times — ids must be unique for links and view-state persistence to work correctly.`);
            }
        });

        (data.pages || []).forEach((page, p) => {
            const pagePath = `pages[${p}] ("${page.title || 'untitled'}")`;
            if (!Array.isArray(page.rows) || page.rows.length === 0) {
                warn(`${pagePath}: page has no rows.`);
                return;
            }
            page.rows.forEach((row, r) => {
                validateElement({ ...(row as any), type: (row as any).type || 'layout' }, data, registry, `${pagePath}.rows[${r}]`);
            });
        });

        (data.modals || []).forEach((modal, m) => {
            const modalPath = `modals[${m}] ("${modal.title || modal.id || 'untitled'}")`;
            (modal.rows || []).forEach((row, r) => {
                validateElement({ ...(row as any), type: (row as any).type || 'layout' }, data, registry, `${modalPath}.rows[${r}]`);
            });
        });
    } catch (error) {
        // The validator itself must never break the app.
        console.warn(`${WARN_PREFIX} Config validation failed unexpectedly:`, error);
    }
}
