import React, { useEffect, useState } from 'react';
import { clearReportState, hasReportState, STATE_CHANGED_EVENT } from '../lib/state-persistence';

export interface HeadbarProps {
    title: string;
    description?: string;
    author?: string;
    lastUpdated?: string;
}

export const Headbar: React.FC<HeadbarProps> = ({ title, description, author, lastUpdated }) => {
    // Show the reset button only when the report has saved customizations;
    // updates live as visuals save/clear their state.
    const [hasSavedState, setHasSavedState] = useState(() => hasReportState());
    useEffect(() => {
        const update = () => setHasSavedState(hasReportState());
        window.addEventListener(STATE_CHANGED_EVENT, update);
        return () => window.removeEventListener(STATE_CHANGED_EVENT, update);
    }, []);

    /**
     * Clears every saved view customization for this report (table sorting,
     * hidden columns, grouping, active tabs, ...) and reloads so all visuals
     * return to their configured defaults.
     */
    const handleResetReport = () => {
        const removed = clearReportState();
        if (removed > 0) {
            location.reload();
        }
    };

    return (
        <header className='dl2-head-bar' style={{ position: 'relative' }}>
            <h1>{title}</h1>
            <div style={{ fontSize: '0.9em', color: 'inherit', opacity: 0.9 }}>
                {author && <span>Author: {author}</span>}
                {lastUpdated && <span> | Last Updated: {lastUpdated}</span>}
            </div>
            {hasSavedState && (
                <button
                    className="dl2-headbar-reset-btn"
                    onClick={handleResetReport}
                    title="Clear all saved view customizations (sorting, hidden columns, grouping, active tabs) and restore the report defaults"
                >
                    Reset view
                </button>
            )}
        </header>
    );
};
