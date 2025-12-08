import React from "react";
import { createContext } from "react";
import { Dataset } from "../../lib/types";

export interface AppContextProps {
    datasets: Record<string, Dataset>;
}

export const AppContext = createContext<AppContextProps>({
    datasets: {}
});