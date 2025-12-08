import React from "react";
import { createContext } from "react";

export interface AppContextProps {
    datasets: Record<string, any>;
}

export const AppContext = createContext<AppContextProps>({
    datasets: {}
});