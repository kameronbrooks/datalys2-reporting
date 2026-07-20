import { ApplicationData } from "./types";
/**
 * Information the validator needs about the visual registry.
 */
export interface ValidationRegistryInfo {
    /** All registered visual type keys (e.g. 'table', 'pie', ...). */
    knownVisualTypes: string[];
    /** Visual types that do not require a datasetId (e.g. 'card', 'tabs'). */
    datasetlessTypes: string[];
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
export declare function validateAppData(data: ApplicationData, registry: ValidationRegistryInfo): void;
