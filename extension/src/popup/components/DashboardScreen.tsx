import React, { useState, useEffect } from 'react';
import { bnsResolver } from '../../utils/bns';
import { Header, Card, Button, IconButton, Alert, ContentContainer, Footer } from './ui';

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
}

interface DashboardScreenProps {
  onWalletLocked: () => void;
  onSendRequest: (account: Account) => void;
  onConnectedSites?: () => void;
  onSettings?: () => void;
}

// Format balance to show up to 4 decimal places, removing trailing zeros
const formatBalance = (balance: string): string => {
  const num = parseFloat(balance);
  if (isNaN(num)) return '0';
  return num.toFixed(4).replace(/\.?0+$/, '');
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onWalletLocked, onSendRequest, onConnectedSites, onSettings }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resolvingBNS, setResolvingBNS] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  // Resolve BNS names for all accounts
  const resolveBNSNames = async (accountsToResolve: Account[]) => {
    setResolvingBNS(true);
    try {
      const updatedAccounts = await Promise.all(
        accountsToResolve.map(async (account) => {
          try {
            const bnsNames = await bnsResolver.reverseResolve(account.address);
            return { ...account, bnsNames };
          } catch (error) {
            console.log('Failed to resolve BNS for', account.address, ':', error);
            return { ...account, bnsNames: [] };
          }
        })
      );
      
      // Only update accounts if we have valid data and preserve existing balance information
      setAccounts(prevAccounts => {
        // Merge BNS names with existing account data to preserve balances
        return prevAccounts.map(prevAccount => {
          const updatedAccount = updatedAccounts.find(acc => acc.address === prevAccount.address);
          if (updatedAccount) {
            // Preserve the existing balance and pending data, only update BNS names
            return {
              ...prevAccount,
              bnsNames: updatedAccount.bnsNames
            };
          }
          return prevAccount;
        });
      });
    } catch (error) {
      console.error('Failed to resolve BNS names:', error);
    } finally {
      setResolvingBNS(false);
    }
  };

  const loadAccounts = async () => {
    try {
      console.log('Loading accounts...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' });
      console.log('GET_ACCOUNTS response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        setLoading(false); // Set loading to false here first
        
        // Try to resolve BNS names in the background (non-blocking)
        setTimeout(() => {
          resolveBNSNames(response.data);
        }, 100);
        
        // Try to refresh balances, but don't block the UI if it fails
        try {
          console.log('Refreshing balances...');
          await refreshBalances();
        } catch (balanceError) {
          console.warn('Failed to refresh balances, but showing accounts anyway:', balanceError);
        }
      } else {
        setError(response.error || 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const refreshBalances = async () => {
    setRefreshing(true);
    try {
      console.log('Dashboard: Requesting balance update...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Balance refresh timeout')), 15000);
      });
      
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'UPDATE_BALANCES' }),
        timeoutPromise
      ]) as any;
      
      console.log('Dashboard: Balance update response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        console.log('Dashboard: Balances updated successfully');
      } else {
        console.warn('Dashboard: Balance update failed:', response.error);
      }
    } catch (error) {
      console.error('Dashboard: Failed to refresh balances:', error);
      // Don't show error to user, just log it
    } finally {
      setRefreshing(false);
    }
  };

  const handleLockWallet = async () => {
    try {
      await chrome.runtime.sendMessage({ type: 'LOCK_WALLET' });
      onWalletLocked();
    } catch (error) {
      console.error('Failed to lock wallet:', error);
    }
  };

  const handleReceivePending = async () => {
    if (accounts.length === 0) return;
    
    setRefreshing(true);
    try {
      console.log('Dashboard: Receiving pending transactions...');
      
      const response = await chrome.runtime.sendMessage({
        type: 'RECEIVE_PENDING',
        address: accounts[0].address
      });
      
      if (response.success) {
        console.log('Dashboard: Received', response.data.received, 'pending transactions');
        
        // Refresh balances after receiving
        await refreshBalances();
      } else {
        console.warn('Dashboard: Failed to receive pending:', response.error);
      }
    } catch (error) {
      console.error('Dashboard: Error receiving pending:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-text-secondary">Loading accounts...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <Header 
        title="MonkeyMask"
        leftElement={
          <div className="flex items-center">
            <span className="text-2xl mr-2">🐒</span>
          </div>
        }
        rightElement={
          <div className="flex items-center space-x-2">
            {onConnectedSites && (
              <IconButton
                onClick={onConnectedSites}
                icon={<span className="text-lg">🔗</span>}
                title="Connected sites"
              />
            )}
            {onSettings && (
              <IconButton
                onClick={onSettings}
                icon={<span className="text-lg">⚙️</span>}
                title="Settings"
              />
            )}
            <IconButton
              onClick={refreshBalances}
              disabled={refreshing}
              icon={
                <span className={`text-lg ${refreshing ? 'animate-spin' : ''}`}>
                  🔄
                </span>
              }
              title="Refresh balances"
            />
            <IconButton
              onClick={handleLockWallet}
              icon={<span className="text-lg">🔒</span>}
              title="Lock wallet"
            />
          </div>
        }
      />

      {/* Account List */}
      <div className="flex-1 overflow-y-auto pt-14">
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              {error}
            </Alert>
          </div>
        )}

        {resolvingBNS && (
          <div className="p-4 text-center text-primary text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-2"></div>
            Resolving BNS names...
          </div>
        )}

        <div className="p-4 space-y-3">
          {accounts.map((account, index) => (
            <Card key={account.address} hover>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-text-primary">{account.name}</h3>
                <div className="text-right">
                  <div className="text-lg font-semibold text-primary">
                    {formatBalance(account.balance)} BAN
                  </div>
                  {account.pending && parseFloat(account.pending) > 0 && (
                    <div className="text-sm text-accent-foreground font-medium">
                      +{formatBalance(account.pending)} BAN pending
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-text-secondary">
                <div className="flex-1">
                  <span className="font-mono">{formatAddress(account.address)}</span>
                  {account.bnsNames && account.bnsNames.length > 0 && (
                    <div className="text-xs text-primary font-medium mt-1">
                      🌐 {account.bnsNames.join(', ')}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => copyAddress(account.address)}
                  className="text-primary hover:text-primary/80 ml-2"
                  title="Copy address"
                >
                  📋
                </button>
              </div>
            </Card>
          ))}
        </div>

        {accounts.length === 0 && !error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-text-secondary">
              <div className="text-4xl mb-2">🙈</div>
              <p>No accounts found</p>
            </div>
          </div>
        )}
      </div>


      <div className="p-4 pb-18">
        <div className="flex justify-center space-x-4">
          <Button 
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={() => accounts.length > 0 && onSendRequest(accounts[0])}
            disabled={accounts.length === 0}
          >
            Send
          </Button>
          <Button 
            variant="secondary"
            size="lg"
            className="flex-1"
            onClick={handleReceivePending}
            disabled={refreshing || accounts.length === 0}
          >
            {refreshing ? 'Receiving...' : 'Receive'}
          </Button>
        </div>
        
        <div className="text-center mt-3">
          <p className="text-xs text-tertiary">
            Phase 3: Transaction Support Active
          </p>
        </div>
      </div>
      <Footer icons={[]} />
    </div>
  );
};
