import React from "react";
export declare const getComponentByType: (type: string) => React.FC<any> | null;
export declare const Visual: ({ type, ...props }: {
    type: string;
    [key: string]: any;
}) => React.JSX.Element;
