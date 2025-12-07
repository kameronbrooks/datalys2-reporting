import React from "react";
import { ReportPage } from "../lib/types"

export interface TabGroupProps {
    pages: ReportPage[];
}

export const TabGroup: React.FC<TabGroupProps> = ({ pages }) => {
    const [activeIndex, setActiveIndex] = React.useState(0);
    return (
        <div>
            <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
                {pages.map((page, index) => (
                    <div
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        style={{
                            padding: '10px 20px',
                            cursor: 'pointer',
                            borderBottom: activeIndex === index ? '3px solid blue' : 'none',
                            fontWeight: activeIndex === index ? 'bold' : 'normal'
                        }}
                    >
                        {page.title}
                    </div>
                ))}
            </div>
            <div>
                <h2>{pages[activeIndex].title}</h2>
                {pages[activeIndex].description && <p>{pages[activeIndex].description}</p>}
                {pages[activeIndex].lastUpdated && <p><em>Last Updated: {pages[activeIndex].lastUpdated}</em></p>}
            </div>
        </div>
    );
}