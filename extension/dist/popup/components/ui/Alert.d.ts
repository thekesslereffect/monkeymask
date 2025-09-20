import React from 'react';
interface AlertProps {
    children: React.ReactNode;
    variant?: 'default' | 'destructive' | 'warning' | 'success';
    className?: string;
}
export declare const Alert: React.FC<AlertProps>;
export {};
