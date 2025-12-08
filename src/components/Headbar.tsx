import React from 'react';

export interface HeadbarProps {
    title: string;
    description?: string;
    author?: string;
    lastUpdated?: string;
}

export const Headbar: React.FC<HeadbarProps> = ({ title, description, author, lastUpdated }) => {
    return (
        <header className='dl2-head-bar'>
            <h1>{title}</h1>
            <div style={{ fontSize: '0.9em', color: '#ffffff' }}>
                {author && <span>Author: {author}</span>}
                {lastUpdated && <span> | Last Updated: {lastUpdated}</span>}
            </div>
        </header>
    );
};