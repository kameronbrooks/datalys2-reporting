import React from "react";
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


const componentRegistry: { [key: string]: React.FC<any> } = {
    'card': Card,
    'pie': PieChart,
    'stackedBar': StackedBarChart,
    'clusteredBar': ClusteredBarChart,
    'line': LineChart,
    'kpi': KPI,
    'scatter': ScatterPlot,
    'table': Table,
    'checklist': Checklist,
    'heatmap': Heatmap,
    'histogram': Histogram,
    // Add other components here as needed
};

export const getComponentByType = (type: string): React.FC<any> | null => {
    return componentRegistry[type] || null;
}


export const Visual = ({ type, ...props }: { type: string; [key: string]: any }) => {
    const Component = getComponentByType(type);
    if (Component) {
        return <Component {...props} />;
    }
    return <div>Unknown component type: {type}</div>;
}