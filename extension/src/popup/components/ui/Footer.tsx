import { Icon } from '@iconify/react';
import React from 'react';

interface FooterProps {
  showTabs?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  showTabs = true,
  className = ''
}) => {
  return (
    <div className={`footer px-4 h-14 fixed bottom-0 left-0 right-0 z-10 ${className}`}>
      {showTabs && (
      <div className="flex items-center w-full h-full justify-between">
          <button onClick={() => console.log('Home')} className="text-text-primary hover:text-primary transition-colors">
            <Icon icon="lucide:home" className="text-2xl" />
          </button>
          <button onClick={() => console.log('NFTs')} className="text-text-primary hover:text-primary transition-colors">
            <Icon icon="lucide:layout-grid" className="text-2xl" />
          </button>
          <button onClick={() => console.log('History')} className="text-text-primary hover:text-primary transition-colors">
            <Icon icon="lucide:clock" className="text-2xl" />
          </button>
          <button onClick={() => console.log('Explore')} className="text-text-primary hover:text-primary transition-colors">
            <Icon icon="lucide:compass" className="text-2xl" />
          </button>
        </div>
      )}
    </div>
  );
};
