import React from 'react';
import { IconButton } from './IconButton';
import { Icon } from '@iconify/react';
import { Drawer } from './Drawer';
import { useAccounts } from '../../hooks/useAccounts';

interface HeaderProps {
  active?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ active = false }) => {
  const { refreshBalances, refreshing } = useAccounts();

  return (
    <div className="header px-4 h-14 fixed top-0 left-0 right-0 z-20  font-semibold">
      {active ? (
      <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center">
          <Drawer />
        </div>        
        <div className="flex items-center">
          <IconButton
            onClick={refreshBalances}
            disabled={refreshing}
            icon={
              <span className={`text-2xl ${refreshing ? 'animate-spin' : ''}`}>
                <Icon icon="lucide:refresh-cw" />
              </span>
            }
            title="Refresh balances"
          />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-center text-xl">
        
            MonkeyMask
         
        </div>
      )}
    </div>
  );
};
