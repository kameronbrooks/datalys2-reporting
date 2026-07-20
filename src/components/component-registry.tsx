import React, { useContext, useMemo } from "react";
import { Card } from "./visuals/Card";
import { PieChart } from "./visuals/PieChart";
import { StackedBarChart } from "./visuals/StackedBarChart";
import { ClusteredBarChart } from "./visuals/ClusteredBarChart";
import { KPI } from "./visuals/KPI";
import { ScatterPlot } from "./visuals/ScatterPlot";
import { Table } from "./visuals/Table";
import { Checklist } from "./visuals/Checklist";
import { Heatmap } from "./visuals/Heatmap";
import { Histogram } from "./visuals/Histogram";
import { LineChart } from "./visuals/LineChart";
import { AreaChart } from "./visuals/AreaChart";
import { BoxPlot } from "./visuals/BoxPlot";
import { Gauge } from "./visuals/Gauge";
import { TabsVisual } from "./visuals/TabsVisual";
import { LinkVisual } from "./visuals/LinkVisual";
import { AppContext } from "./context/AppContext";
import { AggregateSpec, FilterExpression } from "../lib/types";
import { applyFilter } from "../lib/filter-utility";
import { aggregateDataset } from "../lib/aggregate-utility";

interface RegistryEntry {
    component: React.FC<any>;
    /** False for visuals that render without a dataset (e.g. card, tabs). */
    requiresDataset: boolean;
}

const componentRegistry: { [key: string]: RegistryEntry } = {
    'card': { component: Card, requiresDataset: false },
    'pie': { component: PieChart, requiresDataset: true },
    'stackedBar': { component: StackedBarChart, requiresDataset: true },
    'clusteredBar': { component: ClusteredBarChart, requiresDataset: true },
    'line': { component: LineChart, requiresDataset: true },
    'area': { component: AreaChart, requiresDataset: true },
    'kpi': { component: KPI, requiresDataset: true },
    'scatter': { component: ScatterPlot, requiresDataset: true },
    'table': { component: Table, requiresDataset: true },
    'checklist': { component: Checklist, requiresDataset: true },
    'heatmap': { component: Heatmap, requiresDataset: true },
    'histogram': { component: Histogram, requiresDataset: true },
    'boxplot': { component: BoxPlot, requiresDataset: true },
    'gauge': { component: Gauge, requiresDataset: true },
    'tabs': { component: TabsVisual, requiresDataset: false },
    'tabgroup': { component: TabsVisual, requiresDataset: false },
    'link': { component: LinkVisual, requiresDataset: false },
    // Add other components here as needed
};

/**
 * Registers a visual type. Container visuals register themselves via this to
 * avoid circular imports (e.g. tabs → PageRow → Visual → registry).
 */
export const registerComponent = (type: string, entry: RegistryEntry): void => {
    componentRegistry[type] = entry;
};

export const getComponentByType = (type: string): React.FC<any> | null => {
    return componentRegistry[type]?.component || null;
}

/** All registered visual type keys. */
export const getKnownVisualTypes = (): string[] => Object.keys(componentRegistry);

/** Visual types that do not require a datasetId. */
export const getDatasetlessTypes = (): string[] =>
    Object.keys(componentRegistry).filter(key => !componentRegistry[key].requiresDataset);

/**
 * Re-provides the app context with this visual's dataset replaced by a
 * filtered/aggregated view. The visual (and only this visual) then sees the
 * transformed data under the same datasetId — other visuals sharing the
 * dataset are unaffected.
 */
const DataScope: React.FC<{
    datasetId: string;
    filter?: FilterExpression;
    aggregate?: AggregateSpec;
    children: React.ReactNode;
}> = ({ datasetId, filter, aggregate, children }) => {
    const ctx = useContext(AppContext);
    const value = useMemo(() => {
        let ds = ctx.datasets[datasetId];
        if (!ds) return ctx;
        if (filter) ds = applyFilter(ds, filter);
        if (aggregate) ds = aggregateDataset(ds, aggregate);
        return { ...ctx, datasets: { ...ctx.datasets, [datasetId]: ds } };
    }, [ctx, datasetId, filter, aggregate]);
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const Visual = ({ type, ...props }: { type: string; [key: string]: any }) => {
    const Component = getComponentByType(type);
    if (!Component) {
        return (
            <div className="dl2-unknown-visual" style={{ padding: 10, color: 'var(--dl2-error)' }}>
                Unknown component type: {String(type)}. Known types: {getKnownVisualTypes().join(', ')}
            </div>
        );
    }

    const element = <Component {...props} />;

    // Per-visual client-side filtering/aggregation of the shared dataset.
    if (props.datasetId && (props.filter || props.aggregate)) {
        return (
            <DataScope datasetId={props.datasetId} filter={props.filter} aggregate={props.aggregate}>
                {element}
            </DataScope>
        );
    }

    return element;
}
