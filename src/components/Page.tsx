import React from "react";
import { ReportPage } from "../lib/types";


export interface PageProps extends ReportPage {}


export const Page: React.FC<PageProps> = ({ 
        title, 
        description,
        lastUpdated,
        rows
    }) => {
    return (
        <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
            {lastUpdated && <p><em>Last Updated: {lastUpdated}</em></p>}
            <hr />
            {rows ? rows.map((row, rowIndex) => (
                <div 
                    key={rowIndex}
                >
                    {/* Render row content here */}
                </div>
            )) 
            : 
            <p>There are no rows on this page.</p>}
        </div>
    );
};