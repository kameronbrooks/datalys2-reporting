import React from "react";
import { Dataset } from "../../lib/types";
export interface AppContextProps {
    datasets: Record<string, Dataset>;
}
export declare const AppContext: React.Context<AppContextProps>;
