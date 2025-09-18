import React from 'react';

interface FooterProps {
  element?: React.ReactNode;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  element,
  className = ''
}) => {
  return (
    <div className={`footer px-4 h-14 fixed bottom-0 left-0 right-0 z-10 ${className}`}>
        {element || <div className="w-5"></div>}
    </div>
  );
};
