import React from 'react';

interface FooterIcon {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface FooterProps {
  icons: FooterIcon[];
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  icons,
  className = ''
}) => {
  return (
    <div className={`footer p-4 h-14 fixed bottom-0 left-0 right-0 z-10 ${className}`}>
      <div className="flex items-center justify-around w-full h-full">
        {icons.map((iconData, index) => (
          <button
            key={index}
            onClick={iconData.onClick}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ${
              iconData.active 
                ? 'text-bars-icon-active bg-bars/20' 
                : 'text-bars-icon hover:text-bars-icon-active hover:bg-bars/10'
            }`}
            title={iconData.label}
          >
            <div className="text-xl mb-1">
              {iconData.icon}
            </div>
            <span className="text-xs font-medium">
              {iconData.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
