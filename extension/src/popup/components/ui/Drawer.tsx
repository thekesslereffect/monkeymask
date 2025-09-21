import React, { useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { useNavigation } from '../../hooks/useRouter';
import { useAccounts } from '../../hooks/useAccounts';
import { useDrawer } from '../../hooks/useDrawer';
import { formatBalance } from '../../../utils/format';
import { AccountSkeleton } from './Skeleton';
import { Avatar } from './Avatar';

interface DrawerProps {
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  className = ''
}) => {
  console.log('Drawer: Component rendered/re-rendered');
  
  const navigation = useNavigation();
  const { accounts, currentAccountIndex, currentAccount, loading, createNewAccount, switchAccount, removeAccount } = useAccounts();
  const { isOpen, setIsOpen } = useDrawer();

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatAddress = (address: string, ban: boolean = true) => {
    return `${ban ? 'ban_' : ''}${address.slice(4, 8)}...${address.slice(-4)}`;
  };

  const handleRemoveAccount = async (address: string, accountName: string, event: React.MouseEvent) => {
    // Prevent the account selection click
    event.stopPropagation();
    
    try {
      await removeAccount(address);
    } catch (error) {
      console.error('Failed to remove account:', error);
      // Error is already handled in the removeAccount function
    }
  };


  const handleConnectedSites = () => {
    // Close drawer first, then navigate after animation
    setIsOpen(false);
    setTimeout(() => {
      navigation.goToConnectedSites();
    }, 300); // Match the transition duration
  };

  const handleSettings = () => {
    // Close drawer first, then navigate after animation
    setIsOpen(false);
    setTimeout(() => {
      navigation.goToSettings();
    }, 300); // Match the transition duration
  };

  const handleLockWallet = async () => {
    // Close drawer first, then lock and navigate after animation
    setIsOpen(false);
    setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
        navigation.replace('unlock');
      } catch (error) {
        console.error('Failed to lock wallet:', error);
      }
    }, 300); // Match the transition duration
  };
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Track component lifecycle
  useEffect(() => {
    console.log('Drawer: Component mounted');
    return () => {
      console.log('Drawer: Component unmounted');
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      console.log('Drawer: Click outside detected', {
        target: event.target,
        drawerContains: drawerRef.current?.contains(event.target as Node),
        triggerContains: triggerRef.current?.contains(event.target as Node),
        isOpen
      });
      
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        console.log('Drawer: Closing drawer due to outside click');
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (accounts.length === 0 && !loading) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          className="cursor-pointer"
        >
          <Avatar address={currentAccount?.address || ''} size={32} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary text-md">
            {currentAccount?.bnsNames && currentAccount.bnsNames.length > 0 ? currentAccount.bnsNames[0] : formatAddress(currentAccount?.address || '', false)}
          </span>
          <button
            onClick={() => copyAddress(currentAccount?.address || '')}
            className="text-tertiary hover:text-primary/80 text-lg transition-colors"
            title="Copy address"
          >
            <Icon icon="lucide:copy" />
          </button>
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" style={{ zIndex: 100 }} />
      )}

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 left-0 h-screen w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${className}`}
        style={{ zIndex: 110 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Account & Settings
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <Icon icon="lucide:x" className="text-xl text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Account Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Current Account</h3>
            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar address={currentAccount?.address || ''} size={32} />
                <div>
                  <div className="font-medium text-foreground">
                    {currentAccount?.bnsNames && currentAccount.bnsNames.length > 0 ? currentAccount.bnsNames[0] : `Account ${currentAccountIndex + 1}`}
                  </div>
                  <div className="text-sm text-tertiary">
                    {formatAddress(currentAccount?.address || '', false)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tertiary">Balance</div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatBalance(currentAccount?.balance || '0')} BAN
                  </div>
                </div>
                <button
                  onClick={() => copyAddress(currentAccount?.address || '')}
                  className="p-2 hover:bg-background rounded-lg transition-colors"
                  title="Copy address"
                >
                  <Icon icon="lucide:copy" className="text-lg text-tertiary" />
                </button>
              </div>
            </div>
          </div>

          {/* All Accounts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-foreground">All Accounts</h3>
              <button
                onClick={() => {
                  console.log('Drawer: Creating new account');
                  createNewAccount();
                }}
                disabled={loading}
                className="px-3 py-1.5 bg-primary hover:bg-primary/80 text-background text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon icon="lucide:plus" className="text-sm" />
                Add Account
              </button>
            </div>
            <div className="space-y-2">
              {loading ? (
                // Show skeleton loading for accounts
                Array.from({ length: 3 }).map((_, index) => (
                  <AccountSkeleton key={index} />
                ))
              ) : (
                accounts.map((account, index) => (
                <div 
                  key={account.address} 
                  onClick={() => {
                    console.log('Drawer: Switching to account', index);
                    switchAccount(index);
                  }}
                  className={`rounded-lg p-3 transition-colors cursor-pointer ${
                    index === currentAccountIndex 
                      ? 'bg-primary/10 border border-primary/20' 
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar address={account.address} size={32} />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {account.bnsNames && account.bnsNames.length > 0 ? account.bnsNames[0] : `Account ${index + 1}`}
                      </div>
                      <div className="text-sm text-tertiary">
                        {formatAddress(account.address, false)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {formatBalance(account.balance)} BAN
                        </div>
                        {index === currentAccountIndex && (
                          <div className="text-xs text-primary font-medium">Current</div>
                        )}
                      </div>
                      {/* Remove button - only show for non-primary accounts */}
                      {index > 0 && (
                        <button
                          onClick={(e) => handleRemoveAccount(
                            account.address, 
                            account.bnsNames && account.bnsNames.length > 0 ? account.bnsNames[0] : `Account ${index + 1}`,
                            e
                          )}
                          className="flex-shrink-0 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors opacity-70 hover:opacity-100"
                          title="Remove this account"
                        >
                          <Icon icon="lucide:trash-2" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Settings</h3>
            <div className="space-y-2">
              <button
                onClick={handleConnectedSites}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <Icon icon="lucide:link" className="text-lg text-tertiary" />
                <span className="text-foreground">Connected Sites</span>
              </button>
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <Icon icon="lucide:settings" className="text-lg text-tertiary" />
                <span className="text-foreground">Settings</span>
              </button>
              <button
                onClick={handleLockWallet}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors text-left"
              >
                <Icon icon="lucide:lock" className="text-lg text-tertiary" />
                <span className="text-foreground">Lock Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
