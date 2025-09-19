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
    <div className={`flex flex-col font-semibold bg-background justify-start overflow-y-auto items-center px-4 pt-[74px] pb-[74px] gap-4 ${className}`}>
      {children}
    </div>
  );
};
