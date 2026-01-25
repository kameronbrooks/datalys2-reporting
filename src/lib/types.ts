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
    elementType: string;
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
    columns?: number;
    gap?: string | number;
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