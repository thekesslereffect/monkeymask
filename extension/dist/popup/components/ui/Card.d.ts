import React from 'react';
interface CardProps {
    children: React.ReactNode;
    label?: string;
    hintText?: string;
    hintTooltip?: string;
    className?: string;
    hover?: boolean;
    onClick?: () => void;
    hintOnClick?: () => void;
}
export declare const Card: React.FC<CardProps>;
export {};
