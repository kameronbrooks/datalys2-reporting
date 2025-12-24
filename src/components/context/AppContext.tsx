import React from "react";
import { createContext } from "react";
import { Dataset, ReportModal } from "../../lib/types";

export interface AppContextProps {
    datasets: Record<string, Dataset>;
    modals: ReportModal[];
    openModal: (modal: ReportModal | string) => void;
    closeModal: () => void;
}

export const AppContext = createContext<AppContextProps>({
    datasets: {},
    modals: [],
    openModal: () => {},
    closeModal: () => {}
});