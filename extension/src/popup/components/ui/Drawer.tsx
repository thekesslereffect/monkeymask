import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
}

interface DrawerProps {
  className?: string;
  onNavigate?: (screen: string) => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  className = '',
  onNavigate
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      console.log('Loading accounts...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' });
      console.log('GET_ACCOUNTS response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const formatBalance = (balance: string): string => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
    if (num >= 100000) return (num / 100000).toFixed(2) + 'K';
    return num.toFixed(4).replace(/\.?0+$/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleConnectedSites = () => {
    // Close drawer first, then navigate after animation
    setIsOpen(false);
    if (onNavigate) {
      setTimeout(() => {
        onNavigate('ConnectedSitesScreen');
      }, 300); // Match the transition duration
    }
  };

  const handleSettings = () => {
    // Close drawer first, then navigate after animation
    setIsOpen(false);
    if (onNavigate) {
      setTimeout(() => {
        onNavigate('SettingsScreen');
      }, 300); // Match the transition duration
    }
  };

  const handleLockWallet = async () => {
    // Close drawer first, then lock and navigate after animation
    setIsOpen(false);
    setTimeout(async () => {
      try {
        await chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
        if (onNavigate) {
          onNavigate('UnlockScreen');
        }
      } catch (error) {
        console.error('Failed to lock wallet:', error);
      }
    }, 300); // Match the transition duration
  };
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
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

  if (accounts.length === 0) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <div
          ref={triggerRef}
          onClick={() => setIsOpen(true)}
          className="cursor-pointer"
        >
          <div className="h-10 w-10 rounded-full bg-primary"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-primary text-md">
            {accounts[0].bnsNames && accounts[0].bnsNames.length > 0 ? accounts[0].bnsNames[0] : formatAddress(accounts[0].address, false)}
          </span>
          <button
            onClick={() => copyAddress(accounts[0].address)}
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
        className={`fixed top-0 left-0 h-screen w-80 bg-background border-r border-border transform transition-transform duration-300 ease-in-out ${
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
                <div className="h-10 w-10 rounded-full bg-primary"></div>
                <div>
                  <div className="font-medium text-foreground">
                    {accounts[0].bnsNames && accounts[0].bnsNames.length > 0 ? accounts[0].bnsNames[0] : 'Account 1'}
                  </div>
                  <div className="text-sm text-tertiary">
                    {formatAddress(accounts[0].address, false)}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-tertiary">Balance</div>
                  <div className="text-lg font-semibold text-foreground">
                    {formatBalance(accounts[0].balance)} BAN
                  </div>
                </div>
                <button
                  onClick={() => copyAddress(accounts[0].address)}
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
            <h3 className="text-lg font-semibold text-foreground mb-3">All Accounts</h3>
            <div className="space-y-2">
              {accounts.map((account, index) => (
                <div key={account.address} className="bg-muted rounded-lg p-3 hover:bg-muted/80 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary"></div>
                    <div className="flex-1">
                      <div className="font-medium text-foreground">
                        {account.bnsNames && account.bnsNames.length > 0 ? account.bnsNames[0] : `Account ${index + 1}`}
                      </div>
                      <div className="text-sm text-tertiary">
                        {formatAddress(account.address, false)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {formatBalance(account.balance)} BAN
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
