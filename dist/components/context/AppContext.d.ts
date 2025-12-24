import React from "react";
import { Dataset, ReportModal } from "../../lib/types";
export interface AppContextProps {
    datasets: Record<string, Dataset>;
    modals: ReportModal[];
    openModal: (modal: ReportModal | string) => void;
    closeModal: () => void;
}
export declare const AppContext: React.Context<AppContextProps>;
