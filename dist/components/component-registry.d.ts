import React from "react";
interface RegistryEntry {
    component: React.FC<any>;
    /** False for visuals that render without a dataset (e.g. card, tabs). */
    requiresDataset: boolean;
}
/**
 * Registers a visual type. Container visuals register themselves via this to
 * avoid circular imports (e.g. tabs → PageRow → Visual → registry).
 */
export declare const registerComponent: (type: string, entry: RegistryEntry) => void;
export declare const getComponentByType: (type: string) => React.FC<any> | null;
/** All registered visual type keys. */
export declare const getKnownVisualTypes: () => string[];
/** Visual types that do not require a datasetId. */
export declare const getDatasetlessTypes: () => string[];
export declare const Visual: ({ type, ...props }: {
    type: string;
    [key: string]: any;
}) => React.JSX.Element;
export {};
