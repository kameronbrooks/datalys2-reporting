/**
 * Types for report structure
 * Used in various parts of the application
 */


export interface Dataset {
    id: string;
    data: any[];
    columns: string[];
    dtypes: string[];
    format: 'table' | 'records' | 'list' | 'record';
    compression?: 'none' | 'gzip';
    compressedData?: string; // ID of the script tag containing the base64 gzip data
    /**
     * Derived dataset: the id of another dataset to derive this one from.
     * When set, `data`/`columns`/`dtypes`/`format` may be omitted — they are
     * computed by applying `filter` and/or `aggregate` to the source dataset.
     */
    source?: string;
    /** Filter applied to the source dataset (derived datasets only). */
    filter?: FilterExpression;
    /** Group/aggregate applied after the filter (derived datasets only). */
    aggregate?: AggregateSpec;
}

/**
 * Supported filter operators for client-side dataset filtering.
 */
export type FilterOp =
    | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
    | 'in' | 'nin'
    | 'contains' | 'startsWith' | 'endsWith'
    | 'between' | 'isNull' | 'notNull';

/**
 * A single filter condition against one column.
 * - `column`: column name (or index for table-format datasets)
 * - `op`: comparison operator
 * - `value`: comparison value (or `[low, high]` for 'between')
 * - `values`: value list for 'in' / 'nin' (falls back to `value` if it is an array)
 */
export interface FilterCondition {
    column: string | number;
    op: FilterOp;
    value?: any;
    values?: any[];
}

/**
 * Boolean composition of filter expressions.
 * Exactly one of `and`, `or`, `not` should be set.
 */
export interface FilterGroup {
    and?: FilterExpression[];
    or?: FilterExpression[];
    not?: FilterExpression;
}

export type FilterExpression = FilterCondition | FilterGroup;

/**
 * Supported aggregate functions.
 */
export type AggFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'countDistinct' | 'first' | 'last';

/**
 * One aggregate output column: apply `fn` to `column`, expose it as `as`
 * (defaults to `${fn}_${column}`).
 */
export interface AggregateColumn {
    column: string | number;
    fn: AggFn;
    as?: string;
}

/**
 * Group/aggregate specification: group rows by `groupBy` columns and compute
 * `aggregates` per group. Produces a records-format dataset with one row per group.
 */
export interface AggregateSpec {
    groupBy: (string | number)[];
    aggregates: AggregateColumn[];
}

/**
 * Type for color properties in visuals
 * Can be a single color string, a d3 color scheme name, or an array of colors
 */
export type ColorProperty = string | string[];

/**
 * Base interface for layout and visual elements
 * Includes common styling properties
 * 
 * Properties:
 * - elementType: 'visual' | 'layout' - distinguishes between visual and layout elements
 * - padding?: number - optional padding around the element
 * - margin?: number - optional margin around the element
 * - border?: string - optional CSS border property
 * - shadow?: string - optional CSS box-shadow property
 * - flex?: number - optional flex value for layout sizing
 */
export interface LayoutElement {
    /**
     * The element's type as used in JSON configs: 'layout', 'modal', or a
     * visual type key such as 'table', 'pie', 'kpi', 'tabs', ...
     * This is the preferred property; see resolveElementKind in element-utility.
     */
    type?: string;
    /**
     * @deprecated Use `type` instead. Kept for backward compatibility with
     * older configs (`elementType: 'visual'` + `type`, or a bare visual key).
     */
    elementType?: string;
    padding?: number;
    margin?: number;
    border?: string | boolean;
    shadow?: string | boolean;
    flex?: number;
    modalId?: string;
}

/**
 * Interface for a report modal
 * Properties:
 * - id: string - unique identifier for the modal
 * - title: string - title of the modal
 * - description?: string - optional description of the modal
 * - rows?: Layout[] - optional array of layout rows in the modal
 * - buttonLabel?: string - optional label for the button that opens the modal
 */
export interface ReportModal extends LayoutElement {
    elementType: 'modal';
    id: string;
    title: string;
    description?: string;
    rows?: Layout[];
    buttonLabel?: string;
}


/**
 * Interface for report visual elements
 * Extends LayoutElement with visual-specific properties
 * Properties:
 * - id: string - unique identifier for the visual
 * - dataId: string - identifier for the data source
 * - description?: string - optional description of the visual
 * - visualType: string - type of visual (e.g., 'barChart', 'lineChart')
 */
export interface ReportVisual extends LayoutElement {
    id: string;
    datasetId: string;
    description?: string;
    visualType: string;
    otherElements?: ReportVisualElement[];
    /**
     * Client-side filter applied to this visual's view of the dataset.
     * Other visuals referencing the same datasetId are unaffected.
     */
    filter?: FilterExpression;
    /**
     * Client-side group/aggregate applied (after `filter`) to this visual's
     * view of the dataset.
     */
    aggregate?: AggregateSpec;
}

/**
 * An element that can be added to a report visual
 * 
 */
export interface ReportVisualElement {
    visualElementType: 'trend' | 'yAxis' | 'xAxis' | 'marker' | 'label';
    color?: string;
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    lineWidth?: number;
    label?: string;
}

/**
 * Display a trend line on the visualization
 * 
 * Properties:
 * - visualElementType: 'trend' - indicates this is a trend line element
 * - lineStyle: 'solid' | 'dashed' | 'dotted' - style of the trend line
 * - coefficients: number[] - coefficients for the trend line equation
 */
export interface TrendVisualElement extends ReportVisualElement {
    visualElementType: 'trend';
    lineStyle: 'solid' | 'dashed' | 'dotted';
    coefficients: number[]; // Coefficients for the trend line equation
}

/**
 * Display an axis on the visualization
 * 
 * Properties:
 * - visualElementType: 'yAxis' | 'xAxis' - indicates this is an axis element
 * - lineStyle: 'solid' | 'dashed' | 'dotted' - style of the axis line
 * - value?: number | Date | string - optional value for the axis
 */
export interface AxisVisualElement extends ReportVisualElement {
    visualElementType: 'yAxis' | 'xAxis';
    lineStyle: 'solid' | 'dashed' | 'dotted';
    value?: number | Date | string;
}

/**
 * Display a marker on the visualization
 * * Properties:
 * - visualElementType: 'marker' - indicates this is a marker element
 * - value: number | Date | string - value for the marker
 * - size?: number - optional size of the marker
 * - shape?: 'circle' | 'square' | 'triangle' - optional shape of the marker
 */
export interface MarkerVisualElement extends ReportVisualElement {
    visualElementType: 'marker';
    value: number | Date | string;
    size?: number;
    shape?: 'circle' | 'square' | 'triangle';
}

/**
 * Display a label on the visualization
 * * Properties:
 * - visualElementType: 'label' - indicates this is a label element
 * - value: number | Date | string - value for the label
 * - fontSize?: number - optional font size for the label
 * - fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter' - optional font weight for the label
 */
export interface LabelVisualElement extends ReportVisualElement {
    visualElementType: 'label';
    value: number | Date | string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | 'bolder' | 'lighter';
}

/**
 * Threshold configuration for pass/fail coloring in charts.
 * Used by LineChart and AreaChart to color elements based on threshold values.
 */
export interface ThresholdConfig {
    /** The threshold value to compare against. */
    value: number;
    /** Color for values that pass the threshold check. Defaults to green. */
    passColor?: string;
    /** Color for values that fail the threshold check. Defaults to red. */
    failColor?: string;
    /** 
     * How to determine pass/fail:
     * - 'above': values >= threshold pass (default)
     * - 'below': values <= threshold pass
     * - 'equals': values === threshold pass
     */
    mode?: 'above' | 'below' | 'equals';
    /** Whether to show the threshold line on the chart. Defaults to true. */
    showLine?: boolean;
    /** Style for the threshold line. Defaults to 'dashed'. */
    lineStyle?: 'solid' | 'dashed' | 'dotted';
    /** 
     * Width of the color blend transition zone as a percentage of the chart width (0-50).
     * Higher values create a more gradual color transition. Defaults to 5.
     * Set to 0 for a hard edge at the threshold crossing.
     */
    blendWidth?: number;
    /**
     * Which elements to apply threshold coloring to:
     * - 'both': Apply to both lines/areas and markers (default)
     * - 'markers': Only apply to markers, lines/areas keep their original colors
     * - 'lines': Only apply to lines/areas, markers keep their original colors
     */
    applyTo?: 'both' | 'markers' | 'lines';
}

/**
 * Interface for report layout elements
 * Extends LayoutElement with layout-specific properties
 * Properties:
 * - type: 'row' | 'column' - layout type
 * - children: LayoutElement[] - array of child layout or visual elements
 */
export interface Layout extends LayoutElement {
    title?: string;
    direction: 'row' | 'column' | 'grid';
    /** Number of grid columns (grid direction only). Default 3. */
    columns?: number;
    /** Space between children. Defaults to 10px for all directions. */
    gap?: string | number;
    /** Allow flex children to wrap onto multiple lines (row/column only). */
    wrap?: boolean;
    /** CSS align-items for row/column layouts (e.g. 'center', 'stretch'). */
    align?: string;
    /** CSS justify-content for row/column layouts (e.g. 'center', 'space-between'). */
    justify?: string;
    /**
     * Responsive grid: when set, grid columns are computed as
     * repeat(auto-fit, minmax(minChildWidth, 1fr)) instead of a fixed count.
     */
    minChildWidth?: number | string;
    children: LayoutElement[];
}

/**
 * Interface for a report page
 * Properties:
 * - title: string - title of the page
 * - description?: string - optional description of the page
 * - lastUpdated?: string - optional last updated timestamp
 * - rows?: Layout[] - optional array of layout rows on the page
 */

export interface ReportPage {
    title: string;
    description?: string;
    lastUpdated?: string;
    rows?: Layout[];
}

/**
 * Interface for the overall application data
 * Properties:
 * - pages: ReportPage[] - array of report pages
 * - modals?: ReportModal[] - optional array of report modals
 * - datasets: Record<string, Dataset> - mapping of dataset IDs to Dataset objects
 */
export interface ApplicationData {
    pages: ReportPage[];
    modals?: ReportModal[];
    datasets: Record<string, Dataset>;
}