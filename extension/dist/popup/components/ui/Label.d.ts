import React from 'react';
interface LabelProps {
    label?: string;
    hintText?: string;
    hintTooltip?: string;
    className?: string;
    hintOnClick?: () => void;
}
export declare const Label: React.FC<LabelProps>;
export {};
