import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { bnsResolver } from '../../utils/bns';

interface Transaction {
  hash: string;
  type: string;
  amount: string;
  account: string;
  timestamp: string;
  local_timestamp: string;
}

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
  transactions?: Transaction[];
}

interface PriceData {
  banano: {
    usd: number;
  };
}

interface AccountsContextType {
  accounts: Account[];
  currentAccountIndex: number;
  currentAccount: Account | null;
  loading: boolean;
  refreshing: boolean;
  error: string;
  banPrice: number;
  priceLoading: boolean;
  loadAccounts: () => Promise<void>;
  refreshBalances: (skipHistoryFetch?: boolean) => Promise<void>;
  reloadAccounts: () => Promise<void>;
  fetchPrice: () => Promise<void>;
  getUsdBalance: (banBalance: string) => string;
  createNewAccount: () => Promise<void>;
  switchAccount: (index: number) => void;
  removeAccount: (address: string) => Promise<void>;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

interface AccountsProviderProps {
  children: ReactNode;
}

export const AccountsProvider: React.FC<AccountsProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentAccountIndex, setCurrentAccountIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resolvingBNS, setResolvingBNS] = useState(false);
  const [banPrice, setBanPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  const fetchAccountHistory = useCallback(async (address: string) => {
    try {
      console.log('Accounts: Fetching transaction history for:', address);
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_ACCOUNT_HISTORY',
        address: address,
        count: 5 // Only fetch 5 transactions for dashboard display
      });

      if (response.success) {
        const transactions = response.data.transactions;
        console.log('Accounts: Transaction history fetched:', transactions);
        
        // Update the account with transaction history
        setAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.address === address 
              ? { ...account, transactions }
              : account
          )
        );
      } else {
        console.warn('Failed to fetch account history:', response.error);
      }
    } catch (error) {
      console.error('Error fetching account history:', error);
    }
  }, []);

  const refreshBalances = useCallback(async (skipHistoryFetch = false) => {
    setRefreshing(true);
    try {
      console.log('Accounts: Requesting balance update...');
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Balance refresh timeout')), 15000);
      });
      
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'UPDATE_BALANCES' }),
        timeoutPromise
      ]) as any;

      console.log('Accounts: Balance update response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        console.log('Accounts: Balances updated successfully');
        
        // Only fetch transaction history if explicitly requested and not skipped
        if (!skipHistoryFetch && response.data && response.data.length > 0 && currentAccountIndex < response.data.length) {
          try {
            await fetchAccountHistory(response.data[currentAccountIndex].address);
          } catch (historyError) {
            console.warn('Failed to fetch transaction history:', historyError);
          }
        }
      } else {
        console.warn('Accounts: Balance update failed:', response.error);
      }
    } catch (error) {
      console.error('Accounts: Failed to refresh balances:', error);
      // Don't show error to user, just log it
    } finally {
      setRefreshing(false);
    }
  }, [fetchAccountHistory, currentAccountIndex]);

  const loadAccounts = useCallback(async () => {
    try {
      console.log('Loading accounts...');
      const response = await chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' });
      console.log('GET_ACCOUNTS response:', response);
      
      if (response.success) {
        setAccounts(response.data);
        
        // Load saved account index and validate it against the accounts
        try {
          const result = await chrome.storage.local.get(['currentAccountIndex']);
          if (result.currentAccountIndex !== undefined && result.currentAccountIndex >= 0) {
            if (result.currentAccountIndex < response.data.length) {
              console.log('Accounts: Restoring saved account index:', result.currentAccountIndex);
              setCurrentAccountIndex(result.currentAccountIndex);
            } else {
              console.log('Accounts: Saved account index out of bounds, resetting to 0');
              setCurrentAccountIndex(0);
              chrome.storage.local.set({ currentAccountIndex: 0 });
            }
          } else {
            console.log('Accounts: No saved account index, defaulting to 0');
            setCurrentAccountIndex(0);
          }
        } catch (error) {
          console.warn('Accounts: Failed to load saved account index:', error);
          setCurrentAccountIndex(0);
        }
        
        // Try to resolve BNS names in the background (non-blocking)
        setTimeout(() => {
          resolveBNSNames(response.data);
        }, 100);
        
        // Try to refresh balances, but don't block the UI if it fails
        // Skip history fetch during initial load to prevent excessive re-renders
        try {
          console.log('Refreshing balances...');
          await refreshBalances(true); // Skip history fetch during initial load
        } catch (balanceError) {
          console.warn('Failed to refresh balances, but showing accounts anyway:', balanceError);
        }
        
        // Fetch history for the current account after account index is restored
        setTimeout(async () => {
          const savedResult = await chrome.storage.local.get(['currentAccountIndex']);
          const accountIndex = savedResult.currentAccountIndex || 0;
          if (response.data.length > accountIndex && response.data[accountIndex] && (!response.data[accountIndex].transactions || response.data[accountIndex].transactions.length === 0)) {
            console.log('Accounts: Fetching history for current account:', response.data[accountIndex].address);
            fetchAccountHistory(response.data[accountIndex].address);
          }
        }, 100);
      } else {
        setError(response.error || 'Failed to load accounts');
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []); // Remove refreshBalances dependency to prevent circular re-renders

  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      console.log('Accounts: Fetching BAN price...');
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=banano&vs_currencies=usd');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: PriceData = await response.json();
      setBanPrice(data.banano.usd);
      console.log('Accounts: BAN price updated:', data.banano.usd);
    } catch (error) {
      console.error('Accounts: Failed to fetch BAN price:', error);
      // Don't show error to user, just log it
    } finally {
      setPriceLoading(false);
    }
  }, []);

  const getUsdBalance = useCallback((banBalance: string): string => {
    if (!banPrice || banPrice === 0) return '0.00';
    
    const banAmount = parseFloat(banBalance);
    if (isNaN(banAmount)) return '0.00';
    
    const usdAmount = banAmount * banPrice;
    return usdAmount.toFixed(10);
  }, [banPrice]);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Listen for global refresh events (e.g., after transactions, wallet import)
  useEffect(() => {
    const handleTransactionComplete = () => {
      console.log('Accounts: Transaction complete event received, refreshing...');
      refreshBalances();
    };

    const handleWalletImported = () => {
      console.log('Accounts: Wallet imported event received, reloading accounts and refreshing balances...');
      // Reload accounts first, then refresh balances
      loadAccounts();
    };

    // Listen for custom events
    window.addEventListener('monkeymask:transaction-complete', handleTransactionComplete);
    window.addEventListener('monkeymask:wallet-imported', handleWalletImported);
    
    return () => {
      window.removeEventListener('monkeymask:transaction-complete', handleTransactionComplete);
      window.removeEventListener('monkeymask:wallet-imported', handleWalletImported);
    };
  }, [refreshBalances, loadAccounts]);

  // Respond to refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Accounts: Refresh trigger activated, refreshing accounts...');
      refreshBalances();
    }
  }, [refreshTrigger, refreshBalances]);

  // Monitor wallet state changes and reload accounts when wallet becomes unlocked
  useEffect(() => {
    let isActive = true;
    
    const checkWalletStateAndReload = async () => {
      // Don't run if component is unmounted or we already have accounts
      if (!isActive || accounts.length > 0) {
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_WALLET_STATE' });
        if (response.success && response.data.isUnlocked && accounts.length === 0 && isActive) {
          console.log('Accounts: Wallet is unlocked but no accounts loaded, reloading...');
          await loadAccounts();
        }
      } catch (error) {
        console.warn('Accounts: Failed to check wallet state:', error);
      }
    };

    // Check immediately if we have no accounts (regardless of loading state)
    if (accounts.length === 0) {
      checkWalletStateAndReload();
    }

    // Also set up a periodic check every 3 seconds, but only when we have no accounts
    let intervalId: NodeJS.Timeout | null = null;
    if (accounts.length === 0) {
      intervalId = setInterval(() => {
        if (accounts.length === 0 && isActive) {
          checkWalletStateAndReload();
        } else if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }, 3000);
    }

    return () => {
      isActive = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [accounts.length, loading, loadAccounts]);

  // Account index loading and validation is now handled inside loadAccounts() to ensure proper timing

  // Fetch price on mount only
  useEffect(() => {
    fetchPrice();
  }, []); // Remove fetchPrice dependency to prevent re-renders

  const reloadAccounts = useCallback(async () => {
    console.log('Accounts: Manually reloading accounts...');
    setLoading(true);
    await loadAccounts();
  }, []); // Remove loadAccounts dependency to prevent re-renders

  const createNewAccount = useCallback(async () => {
    try {
      console.log('Accounts: Creating new account...');
      // Don't set global loading state to prevent Drawer unmounting
      // setLoading(true);
      
      const response = await chrome.runtime.sendMessage({ type: 'CREATE_NEW_ACCOUNT' });
      
      if (response.success) {
        console.log('Accounts: New account created:', response.data);
        
        // Add a small delay to reduce visual glitching
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Reload accounts to get the updated list - call directly to avoid loading state changes
        try {
          console.log('Loading accounts...');
          const accountsResponse = await chrome.runtime.sendMessage({ type: 'GET_ACCOUNTS' });
          console.log('GET_ACCOUNTS response:', accountsResponse);
          
          if (accountsResponse.success) {
            setAccounts(accountsResponse.data);
            
            // Try to resolve BNS names in the background (non-blocking)
            setTimeout(() => {
              resolveBNSNames(accountsResponse.data);
            }, 100);
            
            // Try to refresh balances, but don't block the UI if it fails
            // Skip history fetch during account creation to prevent excessive re-renders
            try {
              console.log('Refreshing balances...');
              await refreshBalances(true); // Skip history fetch during account creation
            } catch (balanceError) {
              console.warn('Failed to refresh balances, but showing accounts anyway:', balanceError);
            }
            
            // Fetch history for the first account if it doesn't have transactions
            if (accountsResponse.data.length > 0 && accountsResponse.data[0] && (!accountsResponse.data[0].transactions || accountsResponse.data[0].transactions.length === 0)) {
              console.log('Accounts: Fetching history for first account:', accountsResponse.data[0].address);
              fetchAccountHistory(accountsResponse.data[0].address);
            }
          } else {
            setError(accountsResponse.error || 'Failed to load accounts');
          }
        } catch (loadError) {
          console.error('Error loading accounts:', loadError);
          setError('Failed to load accounts');
        }
      } else {
        console.error('Accounts: Failed to create new account:', response.error);
        setError(response.error || 'Failed to create new account');
      }
    } catch (error) {
      console.error('Accounts: Error creating new account:', error);
      setError('Failed to create new account');
    }
    // Don't reset loading state since we didn't set it
    // finally {
    //   setLoading(false);
    // }
  }, [refreshBalances, resolveBNSNames, fetchAccountHistory]);

  // Computed current account
  const currentAccount = accounts.length > 0 && currentAccountIndex < accounts.length 
    ? accounts[currentAccountIndex] 
    : null;

  // Remove an account
  const removeAccount = useCallback(async (address: string) => {
    try {
      console.log('Accounts: Removing account:', address);
      
      // Check if trying to remove the currently selected account
      const accountToRemove = accounts.find(acc => acc.address === address);
      if (!accountToRemove) {
        throw new Error('Account not found');
      }
      
      const accountIndex = accounts.findIndex(acc => acc.address === address);
      
      // Prevent removing the primary account (index 0)
      if (accountIndex === 0) {
        throw new Error('Cannot remove the primary account');
      }
      
      // If removing the currently selected account, switch to account 0
      if (accountIndex === currentAccountIndex) {
        console.log('Accounts: Removing currently selected account, switching to account 0');
        setCurrentAccountIndex(0);
        await chrome.storage.local.set({ currentAccountIndex: 0 });
      }
      // Note: We don't adjust indices for other accounts because after removal and reloading,
      // the accounts will be re-sorted and the currentAccountIndex will be validated in loadAccounts
      
      // Send remove request to background
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_ACCOUNT',
        address
      });
      
      if (response.success) {
        console.log('Accounts: Account removed successfully');
        // Reload accounts to reflect the change
        await loadAccounts();
      } else {
        throw new Error(response.error || 'Failed to remove account');
      }
      
    } catch (error) {
      console.error('Accounts: Failed to remove account:', error);
      setError(error instanceof Error ? error.message : 'Failed to remove account');
    }
  }, [accounts, currentAccountIndex, loadAccounts]);

  // Switch to a different account
  const switchAccount = useCallback((index: number) => {
    if (index >= 0 && index < accounts.length) {
      const previousAccount = currentAccount;
      const newAccount = accounts[index];
      
      setCurrentAccountIndex(index);
      console.log('Accounts: Switched to account index:', index);
      
      // Save the selected account index to storage
      chrome.storage.local.set({ currentAccountIndex: index });
      
      // Notify background script about account change so it can emit events to dApps
      if (previousAccount && newAccount && previousAccount.address !== newAccount.address) {
        chrome.runtime.sendMessage({
          type: 'ACCOUNT_CHANGED',
          previousAccount: previousAccount.address,
          newAccount: newAccount.address
        }).catch(error => {
          console.warn('Failed to notify background about account change:', error);
        });
      }
      
      // Add a small delay to reduce visual glitching
      setTimeout(async () => {
        // Refresh balances to ensure the current account has up-to-date data
        // Inline balance refresh to avoid component unmounting
        try {
          console.log('Accounts: Requesting balance update...');
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Balance refresh timeout')), 15000);
          });
          
          const response = await Promise.race([
            chrome.runtime.sendMessage({ type: 'UPDATE_BALANCES' }),
            timeoutPromise
          ]) as any;

          console.log('Accounts: Balance update response:', response);
          
          if (response.success) {
            setAccounts(response.data);
            console.log('Accounts: Balances updated successfully');
          } else {
            console.warn('Accounts: Balance update failed:', response.error);
          }
        } catch (error) {
          console.error('Accounts: Failed to refresh balances:', error);
        }
        
        // Fetch history for the newly selected account if it doesn't have transactions
        const selectedAccount = accounts[index];
        if (selectedAccount && (!selectedAccount.transactions || selectedAccount.transactions.length === 0)) {
          console.log('Accounts: Fetching history for newly selected account:', selectedAccount.address);
          try {
            const historyResponse = await chrome.runtime.sendMessage({
              type: 'GET_ACCOUNT_HISTORY',
              address: selectedAccount.address,
              count: 5
            });

            if (historyResponse.success) {
              const transactions = historyResponse.data.transactions;
              console.log('Accounts: Transaction history fetched:', transactions);
              
              setAccounts(prevAccounts => 
                prevAccounts.map(account => 
                  account.address === selectedAccount.address 
                    ? { ...account, transactions }
                    : account
                )
              );
            }
          } catch (historyError) {
            console.warn('Failed to fetch account history:', historyError);
          }
        }
      }, 50); // Small delay to reduce glitching
    }
  }, [accounts]);

  const value: AccountsContextType = {
    accounts,
    currentAccountIndex,
    currentAccount,
    loading,
    refreshing,
    error,
    banPrice,
    priceLoading,
    loadAccounts,
    refreshBalances,
    reloadAccounts,
    fetchPrice,
    getUsdBalance,
    createNewAccount,
    switchAccount,
    removeAccount
  };

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = (): AccountsContextType => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountsProvider');
  }
  return context;
};
