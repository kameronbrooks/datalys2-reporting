import React from "react";
import { Card } from "./visuals/Card";
import { PieChart } from "./visuals/PieChart";


const componentRegistry: { [key: string]: React.FC<any> } = {
    'card': Card,
    'pie': PieChart,
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