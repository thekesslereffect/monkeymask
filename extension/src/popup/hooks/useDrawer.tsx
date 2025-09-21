import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DrawerContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextType | null>(null);

interface DrawerProviderProps {
  children: ReactNode;
}

export const DrawerProvider: React.FC<DrawerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = () => {
    console.log('Drawer: Toggling drawer from', isOpen, 'to', !isOpen);
    setIsOpen(!isOpen);
  };

  const debugSetIsOpen = (value: boolean) => {
    console.log('Drawer: setIsOpen called with:', value);
    console.trace('Drawer: setIsOpen call stack');
    setIsOpen(value);
  };

  const value: DrawerContextType = {
    isOpen,
    setIsOpen: debugSetIsOpen,
    toggleDrawer
  };

  return (
    <DrawerContext.Provider value={value}>
      {children}
    </DrawerContext.Provider>
  );
};

export const useDrawer = (): DrawerContextType => {
  const context = useContext(DrawerContext);
  if (!context) {
    throw new Error('useDrawer must be used within a DrawerProvider');
  }
  return context;
};
