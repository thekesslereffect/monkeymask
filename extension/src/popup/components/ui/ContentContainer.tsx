import React from 'react';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentContainer: React.FC<ContentContainerProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex-1 flex flex-col bg-background justify-center items-center px-4 pt-16 pb-16 gap-4 ${className}`}>
      {children}
    </div>
  );
};
