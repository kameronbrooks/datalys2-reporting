/**
 * Types for report structure
 * Used in various parts of the application
 */


export interface Dataset {
    id: string;
    data: any[];
    columns: string[];
    dtypes: string[];
    format: 'table' | 'records' | 'list';
}



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
    border?: string;
    shadow?: string;
    flex?: number;
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
}

/**
 * Interface for report layout elements
 * Extends LayoutElement with layout-specific properties
 * Properties:
 * - type: 'row' | 'column' - layout type
 * - children: LayoutElement[] - array of child layout or visual elements
 */
export interface Layout extends LayoutElement {
    direction: 'row' | 'column';
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
 * - datasets: Record<string, Dataset> - mapping of dataset IDs to Dataset objects
 */
export interface ApplicationData {
    pages: ReportPage[];
    datasets: Record<string, Dataset>;
}