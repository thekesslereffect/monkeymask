'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MonkeyMaskProvider, 
  ConnectResult, 
  AccountInfo, 
  ProviderError,
  Block
} from '@/types/monkeymask';

export interface UseMonkeyMaskReturn {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  accounts: string[];
  
  // Wallet data
  balance: string | null;
  accountInfo: AccountInfo | null;
  
  // Error handling
  error: string | null;
  lastError: ProviderError | null;
  
  // Actions
  connect: (onlyIfTrusted?: boolean) => Promise<ConnectResult | null>;
  disconnect: () => Promise<void>;
  getBalance: (account?: string) => Promise<string | null>;
  getAccountInfo: (account?: string) => Promise<AccountInfo | null>;
  signMessage: (message: string, encoding?: 'utf8' | 'hex') => Promise<unknown>;
  signBlock: (block: Block) => Promise<unknown>;
  sendTransaction: (to: string, amount: string) => Promise<unknown>;
  resolveBNS: (bnsName: string) => Promise<string | null>;
  
  // Utilities
  clearError: () => void;
  refreshBalance: () => Promise<void>;
  refreshAccountInfo: () => Promise<void>;
  
  // Provider info
  isMonkeyMaskInstalled: boolean;
  provider: MonkeyMaskProvider | null;
}

export function useMonkeyMask(): UseMonkeyMaskReturn {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastError, setLastError] = useState<ProviderError | null>(null);
  const [provider, setProvider] = useState<MonkeyMaskProvider | null>(null);
  const [isMonkeyMaskInstalled, setIsMonkeyMaskInstalled] = useState(false);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
    setLastError(null);
  }, []);

  // Error handler
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    console.error('MonkeyMask Error:', err);
    
    const errorMessage = (err as Error)?.message || defaultMessage;
    
    setError(errorMessage);
    setLastError(err instanceof Error ? err as ProviderError : new Error(errorMessage) as ProviderError);
    
    return null;
  }, []);

  // Initialize provider
  useEffect(() => {
    const initializeProvider = () => {
      if (typeof window !== 'undefined' && window.banano) {
        setProvider(window.banano);
        setIsMonkeyMaskInstalled(true);
        
        // Set up event listeners
        window.banano.on('connect', (data: { publicKey: string; accounts?: string[] }) => {
          console.log('MonkeyMask connected:', data);
          setIsConnected(true);
          setPublicKey(data.publicKey);
          if (data.accounts) {
            setAccounts(data.accounts);
          }
          clearError();
        });

        window.banano.on('disconnect', () => {
          console.log('MonkeyMask disconnected');
          setIsConnected(false);
          setPublicKey(null);
          setAccounts([]);
          setBalance(null);
          setAccountInfo(null);
        });

        window.banano.on('accountChanged', (newPublicKey: string) => {
          console.log('MonkeyMask account changed:', newPublicKey);
          setPublicKey(newPublicKey);
          setBalance(null); // Clear balance to trigger refresh
          setAccountInfo(null); // Clear account info to trigger refresh
        });

        // Check initial connection state
        if (window.banano.isConnected && window.banano.publicKey) {
          setIsConnected(true);
          setPublicKey(window.banano.publicKey);
        }
      } else {
        setIsMonkeyMaskInstalled(false);
      }
    };

    // Try to initialize immediately
    initializeProvider();

    // Also listen for the initialization event
    const handleInitialized = () => {
      console.log('MonkeyMask initialized event received');
      initializeProvider();
    };

    window.addEventListener('banano#initialized', handleInitialized);

    // Fallback: try again after a delay
    const timeout = setTimeout(initializeProvider, 1000);

    return () => {
      window.removeEventListener('banano#initialized', handleInitialized);
      clearTimeout(timeout);
    };
  }, [clearError]);

  // Connect wallet
  const connect = useCallback(async (onlyIfTrusted = false): Promise<ConnectResult | null> => {
    if (!provider) {
      return handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
    }

    setIsConnecting(true);
    clearError();

    try {
      const result = await provider.connect({ onlyIfTrusted });
      setIsConnected(true);
      setPublicKey(result.publicKey);
      setAccounts(result.accounts);
      return result;
    } catch (err: unknown) {
      return handleError(err, 'Failed to connect to MonkeyMask');
    } finally {
      setIsConnecting(false);
    }
  }, [provider, handleError, clearError]);

  // Disconnect wallet
  const disconnect = useCallback(async (): Promise<void> => {
    if (!provider) return;

    try {
      await provider.disconnect();
      setIsConnected(false);
      setPublicKey(null);
      setAccounts([]);
      setBalance(null);
      setAccountInfo(null);
      clearError();
    } catch (err: unknown) {
      handleError(err, 'Failed to disconnect from MonkeyMask');
    }
  }, [provider, handleError, clearError]);

  // Get balance
  const getBalance = useCallback(async (account?: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
      return null;
    }

    try {
      const result = await provider.getBalance(account);
      setBalance(result);
      return result;
    } catch (err: unknown) {
      return handleError(err, 'Failed to get balance');
    }
  }, [provider, handleError]);

  // Get account info
  const getAccountInfo = useCallback(async (account?: string): Promise<AccountInfo | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
      return null;
    }

    try {
      const result = await provider.getAccountInfo(account);
      setAccountInfo(result);
      return result;
    } catch (err: unknown) {
      return handleError(err, 'Failed to get account info');
    }
  }, [provider, handleError]);

  // Sign message
  const signMessage = useCallback(async (message: string, encoding: 'utf8' | 'hex' = 'utf8') => {
    if (!provider) {
      return handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
    }

    try {
      return await provider.signMessage(message, encoding);
    } catch (err: unknown) {
      return handleError(err, 'Failed to sign message');
    }
  }, [provider, handleError]);

  // Sign block
  const signBlock = useCallback(async (block: Block) => {
    if (!provider) {
      return handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
    }

    try {
      return await provider.signBlock(block);
    } catch (err: unknown) {
      return handleError(err, 'Failed to sign block');
    }
  }, [provider, handleError]);

  // Send transaction
  const sendTransaction = useCallback(async (to: string, amount: string) => {
    if (!provider || !publicKey) {
      return handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
    }

    try {
      return await provider.sendTransaction(publicKey, to, amount);
    } catch (err: unknown) {
      return handleError(err, 'Failed to send transaction');
    }
  }, [provider, publicKey, handleError]);

  // Resolve BNS
  const resolveBNS = useCallback(async (bnsName: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not connected'), 'MonkeyMask not connected');
      return null;
    }

    try {
      return await provider.resolveBNS(bnsName);
    } catch (err: unknown) {
      return handleError(err, 'Failed to resolve BNS name');
    }
  }, [provider, handleError]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (isConnected && publicKey) {
      await getBalance();
    }
  }, [isConnected, publicKey, getBalance]);

  // Refresh account info
  const refreshAccountInfo = useCallback(async () => {
    if (isConnected && publicKey) {
      await getAccountInfo();
    }
  }, [isConnected, publicKey, getAccountInfo]);

  // Auto-refresh balance and account info when connected
  useEffect(() => {
    if (isConnected && publicKey) {
      refreshBalance();
      refreshAccountInfo();
    }
  }, [isConnected, publicKey, refreshBalance, refreshAccountInfo]);

  return {
    // Connection state
    isConnected,
    isConnecting,
    publicKey,
    accounts,
    
    // Wallet data
    balance,
    accountInfo,
    
    // Error handling
    error,
    lastError,
    
    // Actions
    connect,
    disconnect,
    getBalance,
    getAccountInfo,
    signMessage,
    signBlock,
    sendTransaction,
    resolveBNS,
    
    // Utilities
    clearError,
    refreshBalance,
    refreshAccountInfo,
    
    // Provider info
    isMonkeyMaskInstalled,
    provider
  };
}
