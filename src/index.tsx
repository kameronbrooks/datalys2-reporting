import React from 'react';
import ReactDOM from 'react-dom/client';
import { Headbar } from './components/Headbar';
import { TabGroup } from './components/TabGroup';

function App() {
    // Get data from the script element
    const documentTitle = document.title || 'Datalys2 Report';
    const documentDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const documentAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const documentLastUpdated = document.querySelector('meta[name="last-updated"]')?.getAttribute('content') || '';

    const dataElement = document.getElementById('report-data');
    const data = dataElement ? JSON.parse(dataElement.textContent || '{}') : {};

    return (
        <div>
            <Headbar
                title={documentTitle}
                description={documentDescription}
                author={documentAuthor}
                lastUpdated={documentLastUpdated}
            />
            <div>
                <TabGroup pages={data.pages || []} />
            </div>
        </div>
    );
}

// Mount the React app to the root div
const rootElement = document.getElementById('root');
console.log('Root Element:', rootElement);
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
