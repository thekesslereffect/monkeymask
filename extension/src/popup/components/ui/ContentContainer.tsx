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
    <div
      className={`flex min-h-0 flex-1 w-full min-w-0 flex-col gap-4 overflow-x-hidden overflow-y-auto bg-background px-4 pb-[74px] pt-[74px] font-semibold ${className}`}
    >
      {children}
    </div>
  );
};
