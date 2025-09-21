import React, { ReactNode } from 'react';
interface DrawerContextType {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    toggleDrawer: () => void;
}
interface DrawerProviderProps {
    children: ReactNode;
}
export declare const DrawerProvider: React.FC<DrawerProviderProps>;
export declare const useDrawer: () => DrawerContextType;
export {};
