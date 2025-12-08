import React from "react";
import { ReportPage } from "../lib/types";
import { PageRow } from "./PageRow";


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
                {lastUpdated && <div className="dl2-last-updated"><em>Last Updated: {lastUpdated}</em></div>}
            </div>
            
            {description && (<><p>{description}</p></>)}
            
            <hr />
            {rows ? rows.map((row, rowIndex) => (
                <PageRow key={rowIndex} layout={row} />
            )) 
            : 
            <div className="dl2-no-items-div">
                <p>There are no rows on this page.</p>
            </div>}
        </div>
    );
};