import React from "react";
import { ReportPage } from "../lib/types";


export interface PageProps {
    page: ReportPage;
}


export const Page: React.FC<PageProps> = ({ 
        page
    }) => {

    const { title, description, lastUpdated, rows } = page;

    return (
        
        <div>
            <div className="dl2-page-report-header">
                <h1>{title}</h1>
                {lastUpdated && <div><em>Last Updated: {lastUpdated}</em></div>}
            </div>
            
            {description && <p>{description}</p>}
            
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