import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { bnsResolver } from '../../utils/bns';

interface Account {
  address: string;
  name: string;
  balance: string;
  pending?: string;
  bnsNames?: string[];
}

interface PriceData {
  banano: {
    usd: number;
  };
}

interface AccountsContextType {
  accounts: Account[];
  loading: boolean;
  refreshing: boolean;
  error: string;
  banPrice: number;
  priceLoading: boolean;
  loadAccounts: () => Promise<void>;
  refreshBalances: () => Promise<void>;
  reloadAccounts: () => Promise<void>;
  fetchPrice: () => Promise<void>;
  getUsdBalance: (banBalance: string) => string;
}

const AccountsContext = createContext<AccountsContextType | null>(null);

interface AccountsProviderProps {
  children: ReactNode;
}

export const AccountsProvider: React.FC<AccountsProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [resolvingBNS, setResolvingBNS] = useState(false);
  const [banPrice, setBanPrice] = useState<number>(0);
  const [priceLoading, setPriceLoading] = useState(false);

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

  const refreshBalances = useCallback(async () => {
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
      } else {
        console.warn('Accounts: Balance update failed:', response.error);
      }
    } catch (error) {
      console.error('Accounts: Failed to refresh balances:', error);
      // Don't show error to user, just log it
    } finally {
      setRefreshing(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
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
  }, [refreshBalances]);

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

  // Fetch price on mount and when accounts change
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  const reloadAccounts = useCallback(async () => {
    console.log('Accounts: Manually reloading accounts...');
    setLoading(true);
    await loadAccounts();
  }, [loadAccounts]);

  const value: AccountsContextType = {
    accounts,
    loading,
    refreshing,
    error,
    banPrice,
    priceLoading,
    loadAccounts,
    refreshBalances,
    reloadAccounts,
    fetchPrice,
    getUsdBalance
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
