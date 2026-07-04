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
      <div className="flex items-center w-full h-full justify-around">
          <button
            onClick={() => navigation.goToDashboard()}
            title="Wallet"
            className={`${currentRoute === 'dashboard' ? 'text-primary' : 'text-tertiary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:wallet" className="text-2xl" />
          </button>
          <button
            onClick={() => navigation.goToNFTs()}
            title="Collectibles"
            className={`${currentRoute === 'nfts' ? 'text-primary' : 'text-tertiary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:image" className="text-2xl" />
          </button>
          <button
            onClick={() => navigation.goToExplore()}
            title="Explore"
            className={`${currentRoute === 'explore' ? 'text-primary' : 'text-tertiary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:compass" className="text-2xl" />
          </button>
          <button
            onClick={() => navigation.goToRepresentative()}
            title="Representative"
            className={`${currentRoute === 'representative' ? 'text-primary' : 'text-tertiary hover:text-primary'} transition-colors`}
          >
            <Icon icon="lucide:landmark" className="text-2xl" />
          </button>
        </div>
      )}
    </div>
  );
};
