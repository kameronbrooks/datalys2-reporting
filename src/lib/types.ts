/**
 * Types for report structure
 * Used in various parts of the application
 */


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
interface LayoutElement {
    elementType: 'visual' | 'layout';
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
interface ReportVisual extends LayoutElement {
    id: string;
    dataId: string;
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
interface Layout extends LayoutElement {
    type: 'row' | 'column';
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