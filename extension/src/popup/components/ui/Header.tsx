import React from 'react';

interface HeaderProps {
  title: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  leftElement,
  rightElement
}) => {
  return (
    <div className="header px-4 h-14 fixed top-0 left-0 right-0 z-20  font-semibold">
      <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center">
          {leftElement || <div className="w-5"></div>}
        </div>
        
        <h1 className="text-md text-primary">{title}</h1>
        
        <div className="flex items-center">
          {rightElement }
        </div>
      </div>
    </div>
  );
};
