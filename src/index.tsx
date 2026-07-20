import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AppContext, ModalContext } from './components/context/AppContext';
import { Headbar } from './components/Headbar';
import { TabGroup } from './components/TabGroup';
import { Modal } from './components/Modal';
import { ApplicationData, Dataset, ReportModal } from './lib/types';
import { decompressDatasets } from './lib/dataset-utility';
import { decompressGzipB64ToObject } from './lib/compression-utility';
import { validateAppData } from './lib/validation-utility';
import { getDatasetlessTypes, getKnownVisualTypes } from './components/component-registry';
import { findPageIndexForTarget, requestNavigation, scrollToVisual } from './lib/navigation-utility';

function App() {
    const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [activeModal, setActiveModal] = useState<ReportModal | null>(null);
    const [modalContext, setModalContext] = useState<ModalContext | null>(null);
    const [appData, setAppData] = useState<ApplicationData>({ pages: [], datasets: {} });

    const openModal = (modalOrId: ReportModal | string, context?: ModalContext) => {
        setModalContext(context || null);
        if (typeof modalOrId === 'string') {
            const found = (appData.modals || []).find(m => m.id === modalOrId);
            if (found) {
                setActiveModal(found);
            } else {
                console.warn(`[datalys2] Modal "${modalOrId}" not found.`);
            }
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
    const closeModal = () => {
        setActiveModal(null);
        setModalContext(null);
    };

    const [activePageIndex, setActivePageIndex] = useState(0);

    /**
     * Navigates to a visual by id: closes any open modal, switches to the
     * page containing it, lets tab containers activate the right tab, then
     * scrolls to and highlights the element.
     */
    const navigateTo = (targetId: string) => {
        if (!targetId) return;
        setActiveModal(null);
        setModalContext(null);
        const pageIndex = findPageIndexForTarget(appData.pages || [], targetId);
        if (pageIndex >= 0) {
            setActivePageIndex(pageIndex);
        }
        requestNavigation(targetId);
        scrollToVisual(targetId);
    };
    const navigateToRef = useRef(navigateTo);
    navigateToRef.current = navigateTo;

    // #hash navigation: plain anchors like <a href="#visual-id"> (e.g. in
    // markdown cards) navigate across pages too.
    useEffect(() => {
        if (!isLoaded) return;
        const handleHash = () => {
            const hash = decodeURIComponent(location.hash.slice(1));
            if (hash) navigateToRef.current(hash);
        };
        window.addEventListener('hashchange', handleHash);
        if (location.hash) {
            // Initial-load deep link
            setTimeout(handleHash, 100);
        }
        return () => window.removeEventListener('hashchange', handleHash);
    }, [isLoaded]);

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

            // Decompress datasets if present (also resolves derived datasets)
            let loadedDatasets: Record<string, Dataset> = parsedData.datasets || {};
            if (parsedData.datasets) {
                loadedDatasets = await decompressDatasets(parsedData.datasets, shouldGC);
                setDatasets(loadedDatasets);
            }

            // Validate the config and warn about common mistakes.
            // Opt out with <meta name="dl2-validate" content="false">.
            const validateOptOut = document.querySelector('meta[name="dl2-validate"]')?.getAttribute('content') === 'false';
            if (!validateOptOut) {
                validateAppData({ ...parsedData, datasets: loadedDatasets }, {
                    knownVisualTypes: getKnownVisualTypes(),
                    datasetlessTypes: getDatasetlessTypes()
                });
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
            closeModal,
            modalContext,
            navigateTo
        }}>
            <div>
                <Headbar
                    title={documentTitle}
                    description={documentDescription}
                    author={documentAuthor}
                    lastUpdated={documentLastUpdated}
                />
                <div>
                    <TabGroup
                        pages={appData.pages || []}
                        activeIndex={activePageIndex}
                        onSelect={setActivePageIndex}
                    />
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
