import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext } from './components/context/AppContext';
import { Headbar } from './components/Headbar';
import { TabGroup } from './components/TabGroup';
import { ApplicationData } from './lib/types';

function App() {
    // Get data from the script element
    const documentTitle = document.title || 'Datalys2 Report';
    const documentDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const documentAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const documentLastUpdated = document.querySelector('meta[name="last-updated"]')?.getAttribute('content') || '';

    const dataElement = document.getElementById('report-data');
    const data:ApplicationData = dataElement ? JSON.parse(dataElement.textContent || '{}') : {};

    return (
        <AppContext.Provider value={{ datasets: data.datasets || {} }}>
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
        </AppContext.Provider>
    );
}

// Mount the React app to the root div
const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
