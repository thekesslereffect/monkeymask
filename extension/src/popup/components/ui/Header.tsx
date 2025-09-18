import React from 'react';

interface HeaderProps {
  title: string;
  showInfoButton?: boolean;
  onInfoClick?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showInfoButton = false,
  onInfoClick,
  leftElement,
  rightElement
}) => {
  return (
    <div className="header p-4 h-14 fixed top-0 left-0 right-0 z-10  font-semibold">
      <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center">
          {leftElement || <div className="w-5"></div>}
        </div>
        
        <h1 className="text-md text-primary">{title}</h1>
        
        <div className="flex items-center">
          {rightElement || (
            showInfoButton ? (
              <button 
                onClick={onInfoClick}
                className="w-5 h-5 rounded-full border-2 border-tertiary flex items-center justify-center hover:bg-muted transition-colors"
              >
                <span className="text-xs text-tertiary">i</span>
              </button>
            ) : (
              <div className="w-5"></div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
