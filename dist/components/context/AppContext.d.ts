import React from "react";
import { Dataset, ReportModal } from "../../lib/types";
/**
 * Extra data attached to an open modal — currently the data row a
 * row-detail modal was opened for.
 */
export interface ModalContext {
    row?: Record<string, any>;
    datasetId?: string;
}
export interface AppContextProps {
    datasets: Record<string, Dataset>;
    modals: ReportModal[];
    openModal: (modal: ReportModal | string, context?: ModalContext) => void;
    closeModal: () => void;
    /** Context of the currently open modal (e.g. the clicked row). */
    modalContext?: ModalContext | null;
}
export declare const AppContext: React.Context<AppContextProps>;
