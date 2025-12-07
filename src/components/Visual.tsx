import React  from "react";


export interface VisualProps {
    data: any;
}

export const Visual: React.FC<VisualProps> = ({ data }) => {
    return (
        <div>
            <h2>Visual Component</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
};