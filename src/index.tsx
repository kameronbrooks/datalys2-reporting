import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext } from './components/context/AppContext';
import { Headbar } from './components/Headbar';
import { TabGroup } from './components/TabGroup';
import { ApplicationData, Dataset } from './lib/types';
import { decompressDatasets } from './lib/dataset-utility';

function App() {
    const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
    const [isLoaded, setIsLoaded] = useState(false);

    // Get data from the script element only once
    const data = useMemo(() => {
        const dataElement = document.getElementById('report-data');
        if (!dataElement) return { pages: [], datasets: {} } as ApplicationData;
        
        const parsedData: ApplicationData = JSON.parse(dataElement.textContent || '{}');
        
        // Check for GC meta tag
        const shouldGC = document.querySelector('meta[name="gc-compressed-data"]')?.getAttribute('content') === 'true';
        if (shouldGC) {
            dataElement.textContent = '';
        }
        
        return parsedData;
    }, []);

    const documentTitle = document.title || 'Datalys2 Report';
    const documentDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const documentAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const documentLastUpdated = document.querySelector('meta[name="last-updated"]')?.getAttribute('content') || '';

    useEffect(() => {
        const loadData = async () => {
            const shouldGC = document.querySelector('meta[name="gc-compressed-data"]')?.getAttribute('content') === 'true';
            if (data.datasets) {
                const decompressed = await decompressDatasets(data.datasets, shouldGC);
                setDatasets(decompressed);
            }
            setIsLoaded(true);
        };
        loadData();
    }, [data]);

    if (!isLoaded) {
        return <div>Loading report data...</div>;
    }

    return (
        <AppContext.Provider value={{ datasets: datasets }}>
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
