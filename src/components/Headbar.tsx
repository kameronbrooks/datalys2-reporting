import React from 'react';

export interface HeadbarProps {
    title: string;
    description?: string;
    author?: string;
    lastUpdated?: string;
}

export const Headbar: React.FC<HeadbarProps> = ({ title, description, author, lastUpdated }) => {
    return (
        <header style={{ padding: '10px', borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
            <h1>{title}</h1>
            <div style={{ fontSize: '0.9em', color: '#666' }}>
                {author && <span>Author: {author}</span>}
                {lastUpdated && <span> | Last Updated: {lastUpdated}</span>}
            </div>
        </header>
    );
};