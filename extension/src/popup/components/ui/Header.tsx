import React from 'react';
import { IconButton } from './IconButton';
import { Icon } from '@iconify/react';
import { Drawer } from './Drawer';
import { MonkeyLogo } from './MonkeyLogo';
import { useAccounts } from '../../hooks/useAccounts';
import { useNavigation } from '../../hooks/useRouter';

interface HeaderProps {
  active?: boolean;
}

/** Brand lockup shown on the left of the header (and centered when locked). */
const Brand: React.FC = () => (
  <div className="flex items-center gap-2">
    <div className="flex size-8 items-center justify-center rounded-full bg-black text-white">
      <MonkeyLogo className="size-5" />
    </div>
    <span className="text-sm font-bold text-foreground">MonKeyMask</span>
  </div>
);

export const Header: React.FC<HeaderProps> = ({ active = false }) => {
  const { refreshBalances, refreshing } = useAccounts();
  const navigation = useNavigation();

  return (
    <div className="header px-4 h-14 fixed top-0 left-0 right-0 z-20 font-semibold">
      {active ? (
        <div className="flex items-center justify-between w-full h-full">
          <Brand />
          <div className="flex items-center gap-1">
            <Drawer />
            <IconButton
              onClick={() => refreshBalances()}
              disabled={refreshing}
              size="sm"
              icon={
                <span className={`text-lg ${refreshing ? 'animate-spin' : ''}`}>
                  <Icon icon="lucide:refresh-cw" />
                </span>
              }
              title="Refresh balances"
            />
            <IconButton
              onClick={() => navigation.goToSettings()}
              size="sm"
              icon={
                <span className="text-lg">
                  <Icon icon="lucide:settings" />
                </span>
              }
              title="Settings"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-full">
          <Brand />
        </div>
      )}
    </div>
  );
};
