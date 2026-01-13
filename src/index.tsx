import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext } from './components/context/AppContext';
import { Headbar } from './components/Headbar';
import { TabGroup } from './components/TabGroup';
import { Modal } from './components/Modal';
import { ApplicationData, Dataset, ReportModal } from './lib/types';
import { decompressDatasets } from './lib/dataset-utility';
import { decompressGzipB64ToObject } from './lib/compression-utility';

function App() {
    const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeModal, setActiveModal] = useState<ReportModal | null>(null);
    const [appData, setAppData] = useState<ApplicationData>({ pages: [], datasets: {} });

    const openModal = (modalOrId: ReportModal | string) => {
        if (typeof modalOrId === 'string') {
            const found = (appData.modals || []).find(m => m.id === modalOrId);
            if (found) setActiveModal(found);
        } else {
            // If the object passed doesn't have rows, try to find it in global modals by ID
            if (!modalOrId.rows && modalOrId.id) {
                const found = (appData.modals || []).find(m => m.id === modalOrId.id);
                if (found) {
                    setActiveModal(found);
                    return;
                }
            }
            setActiveModal(modalOrId);
        }
    };
    const closeModal = () => setActiveModal(null);

    const documentTitle = document.title || 'Datalys2 Report';
    const documentDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const documentAuthor = document.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    const documentLastUpdated = document.querySelector('meta[name="last-updated"]')?.getAttribute('content') || '';

    useEffect(() => {
        const loadData = async () => {
            const dataElement = document.getElementById('report-data');
            if (!dataElement) {
                setIsLoaded(true);
                return;
            }

            // Parse data (with decompression if needed)
            let parsedData: ApplicationData;
            if (dataElement.getAttribute('type') === 'text/b64-gzip') {
                parsedData = await decompressGzipB64ToObject<ApplicationData>(dataElement.textContent || '');
            } else {
                parsedData = JSON.parse(dataElement.textContent || '{}');
            }

            // Clear data element if GC is enabled
            const shouldGC = document.querySelector('meta[name="gc-compressed-data"]')?.getAttribute('content') === 'true';
            if (shouldGC) {
                dataElement.textContent = '';
            }

            setAppData(parsedData);

            // Decompress datasets if present
            if (parsedData.datasets) {
                const decompressed = await decompressDatasets(parsedData.datasets, shouldGC);
                setDatasets(decompressed);
            }

            setIsLoaded(true);
        };
        loadData();
    }, []);

    if (!isLoaded) {
        return <div>Loading report data...</div>;
    }

    return (
        <AppContext.Provider value={{ 
            datasets: datasets, 
            modals: appData.modals || [],
            openModal,
            closeModal
        }}>
            <div>
                <Headbar
                    title={documentTitle}
                    description={documentDescription}
                    author={documentAuthor}
                    lastUpdated={documentLastUpdated}
                />
                <div>
                    <TabGroup pages={appData.pages || []} />
                </div>
                {activeModal && <Modal modal={activeModal} />}
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
