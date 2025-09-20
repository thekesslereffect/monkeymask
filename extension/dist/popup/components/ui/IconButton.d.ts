import React from 'react';
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'ghost';
}
export declare const IconButton: React.FC<IconButtonProps>;
export {};
