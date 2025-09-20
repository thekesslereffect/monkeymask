import React from 'react';
interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    label?: string;
    hintText?: string;
    hintTooltip?: string;
    error?: string;
    helperText?: string;
    variant?: 'default' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
}
export declare const Input: React.FC<InputProps>;
export {};
