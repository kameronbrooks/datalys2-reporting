import React from 'react';
export interface HeadbarProps {
    title: string;
    description?: string;
    author?: string;
    lastUpdated?: string;
}
export declare const Headbar: React.FC<HeadbarProps>;
