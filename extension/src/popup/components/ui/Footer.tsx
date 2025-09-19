import { Icon } from '@iconify/react';
import React from 'react';
import { useNavigation, useRouter } from '../../hooks/useRouter';
interface FooterProps {
  active?: boolean;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  active = true,
  className = ''
}) => {
  const navigation = useNavigation();
  const router = useRouter();
  const currentRoute = router.currentRoute;

  return (
    <div className={`footer px-4 h-14 fixed bottom-0 left-0 right-0 z-10 ${className}`}>
      {active && (
      <div className="flex items-center w-full h-full justify-between">
          <button 
            onClick={() => navigation.goToDashboard()} 
            className={`${currentRoute === 'dashboard' ? 'text-primary' : 'text-text-primary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:home" className="text-2xl" />
          </button>
          <button 
            onClick={() => navigation.goToNFTs()} 
            className={`${currentRoute === 'nfts' ? 'text-primary' : 'text-text-primary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:layout-grid" className="text-2xl" />
          </button>
          <button 
            onClick={() => navigation.goToHistory()} 
            className={`${currentRoute === 'history' ? 'text-primary' : 'text-text-primary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:clock" className="text-2xl" />
          </button>
          <button 
            onClick={() => navigation.goToExplore()} 
            className={`${currentRoute === 'explore' ? 'text-primary' : 'text-text-primary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:compass" className="text-2xl" />
          </button>
        </div>
      )}
    </div>
  );
};
