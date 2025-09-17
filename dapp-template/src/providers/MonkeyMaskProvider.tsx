'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { MonkeyMaskProvider as MonkeyMaskAPI, AccountInfo, Block, SignBlockResult } from '@/types/monkeymask';

// Simplified context interface - only expose what developers need
interface MonkeyMaskContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  accounts: string[];
  
  // Core actions
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  
  // Account methods
  getAccounts: () => Promise<string[]>;
  getBalance: (address?: string) => Promise<string | null>;
  getAccountInfo: (address?: string) => Promise<AccountInfo | null>;
  
  // Transaction methods
  sendTransaction: (to: string, amount: string) => Promise<string | null>;
  signMessage: (message: string) => Promise<string | null>;
  signBlock: (block: Block) => Promise<SignBlockResult | null>;
  sendBlock: (block: Block) => Promise<string | null>;
  
  // Utility methods
  resolveBNS: (bnsName: string) => Promise<string | null>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  
  // Extension status
  isInstalled: boolean;
}

const MonkeyMaskContext = createContext<MonkeyMaskContextType | null>(null);

interface MonkeyMaskProviderProps {
  children: ReactNode;
  config?: {
    autoConnect?: boolean;
    onConnect?: (publicKey: string) => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
  };
}

export function MonkeyMaskProvider({ children, config = {} }: MonkeyMaskProviderProps) {
  const { autoConnect = true, onConnect, onDisconnect, onError } = config;
  
  // State
  const [provider, setProvider] = useState<MonkeyMaskAPI | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userDisconnected, setUserDisconnected] = useState(false);

  // Error handling
  const handleError = useCallback((err: unknown, defaultMessage: string) => {
    console.error('MonkeyMask Error:', err);
    const errorMessage = (err as Error)?.message || defaultMessage;
    
    if (errorMessage.includes('Extension context invalidated') || 
        errorMessage.includes('context invalidated') ||
        errorMessage.includes('message port closed')) {
      setError('Extension connection lost. Please refresh the page.');
      setIsConnected(false);
      setPublicKey(null);
      setAccounts([]);
    } else if (errorMessage.includes('Wallet is locked') || 
               errorMessage.includes('locked') ||
               errorMessage.includes('unlock')) {
      setError('Wallet is locked. The extension will prompt you to unlock for this transaction.');
    } else if (errorMessage.includes('User rejected') || 
               errorMessage.includes('rejected')) {
      setError('Transaction was rejected by user.');
    } else {
      setError(errorMessage);
    }
    
    onError?.(errorMessage);
  }, [onError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize provider
  useEffect(() => {
    const initializeProvider = () => {
      if (typeof window !== 'undefined' && window.banano) {
        console.log('MonkeyMask detected');
        setProvider(window.banano);
        setIsInstalled(true);
        
        // Set up event listeners
        window.banano.on('connect', (data: { publicKey: string; accounts?: string[] }) => {
          console.log('MonkeyMask connected:', data.publicKey);
          setIsConnected(true);
          setPublicKey(data.publicKey);
          setAccounts(data.accounts || [data.publicKey]);
          clearError();
          onConnect?.(data.publicKey);
        });

        window.banano.on('disconnect', () => {
          console.log('MonkeyMask disconnected');
          setIsConnected(false);
          setPublicKey(null);
          setAccounts([]);
          setUserDisconnected(false); // Reset user disconnect flag when extension disconnects
          onDisconnect?.();
        });

        window.banano.on('accountChanged', (newPublicKey: string) => {
          console.log('Account changed:', newPublicKey);
          setPublicKey(newPublicKey);
          // Update accounts list - in a real scenario, we might need to fetch this
          setAccounts([newPublicKey]);
          onConnect?.(newPublicKey);
        });

        // Check if already connected
        if (window.banano.isConnected && window.banano.publicKey) {
          setIsConnected(true);
          setPublicKey(window.banano.publicKey);
          setAccounts([window.banano.publicKey]);
        }
      } else {
        console.log('MonkeyMask not detected');
        setIsInstalled(false);
      }
    };

    // Try to initialize with retries
    let retryCount = 0;
    const maxRetries = 3;
    
    const tryInitialize = () => {
      initializeProvider();
      if (!isInstalled && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInitialize, 1000);
      }
    };

    tryInitialize();
  }, [isInstalled, onConnect, onDisconnect, clearError]);

  // Auto-connect on load (but not if user manually disconnected)
  // Only auto-connect if the user has previously connected to this site
  useEffect(() => {
    if (autoConnect && provider && !isConnected && isInstalled && !userDisconnected) {
      // Use a timeout to avoid the initialization issue
      const timeoutId = setTimeout(() => {
        if (provider && !isConnected && isInstalled && !userDisconnected) {
          // Try to connect with onlyIfTrusted: true first (only if user previously connected)
          provider.connect({ onlyIfTrusted: true }).catch(() => {
            // If trusted connection fails, don't auto-connect
            // This prevents auto-connect on first visit
            console.log('No trusted connection found, skipping auto-connect');
          });
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [autoConnect, provider, isConnected, isInstalled, userDisconnected, handleError]);

  // Core actions
  const connect = useCallback(async (): Promise<void> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return;
    }

    setIsConnecting(true);
    clearError();
    setUserDisconnected(false); // Reset user disconnect flag when manually connecting

    try {
      await provider.connect({ onlyIfTrusted: false });
      // State will be updated via event listeners
    } catch (err: unknown) {
      handleError(err, 'Failed to connect to MonkeyMask');
    } finally {
      setIsConnecting(false);
    }
  }, [provider, handleError, clearError]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (!provider) return;

    try {
      setUserDisconnected(true); // Mark that user manually disconnected
      await provider.disconnect();
      // State will be updated via event listeners
    } catch (err: unknown) {
      handleError(err, 'Failed to disconnect');
    }
  }, [provider, handleError]);

  // Account methods - these work even when wallet is locked
  const getAccounts = useCallback(async (): Promise<string[]> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return [];
    }

    try {
      const accounts = await provider.getAccounts();
      setAccounts(accounts);
      return accounts;
    } catch (err: unknown) {
      handleError(err, 'Failed to get accounts');
      return [];
    }
  }, [provider, handleError]);

  const getBalance = useCallback(async (address?: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    try {
      const balance = await provider.getBalance(address);
      return balance;
    } catch (err: unknown) {
      handleError(err, 'Failed to get balance');
      return null;
    }
  }, [provider, handleError]);

  const getAccountInfo = useCallback(async (address?: string): Promise<AccountInfo | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    try {
      const accountInfo = await provider.getAccountInfo(address);
      return accountInfo;
    } catch (err: unknown) {
      handleError(err, 'Failed to get account info');
      return null;
    }
  }, [provider, handleError]);

  const sendTransaction = useCallback(async (to: string, amount: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }
    
    // Allow transactions even when isConnected is false (wallet might be locked)
    // The extension will handle prompting for unlock and approval
    if (!publicKey) {
      handleError(new Error('No account selected'), 'Please connect your wallet first');
      return null;
    }

    try {
      // Handle BNS resolution if the address looks like a BNS name
      let resolvedAddress = to;
      if (to.includes('.ban') || to.includes('.banano')) {
        try {
          resolvedAddress = await provider.resolveBNS(to);
          if (!resolvedAddress) {
            handleError(new Error(`Failed to resolve BNS name: ${to}`), 'BNS resolution failed');
            return null;
          }
        } catch (bnsError) {
          handleError(bnsError, `Failed to resolve BNS name: ${to}`);
          return null;
        }
      }

      const result = await provider.sendTransaction(publicKey, resolvedAddress, amount);
      return result.hash;
    } catch (err: unknown) {
      handleError(err, 'Failed to send transaction');
      return null;
    }
  }, [provider, publicKey, handleError]);

  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }
    
    // Allow signing even when isConnected is false (wallet might be locked)
    // The extension will handle prompting for unlock and approval
    if (!publicKey) {
      handleError(new Error('No account selected'), 'Please connect your wallet first');
      return null;
    }

    try {
      const result = await provider.signMessage(message);
      // Convert Uint8Array to hex string for easier handling
      return Array.from(result.signature, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (err: unknown) {
      handleError(err, 'Failed to sign message');
      return null;
    }
  }, [provider, publicKey, handleError]);

  const signBlock = useCallback(async (block: Block): Promise<SignBlockResult | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }
    
    // Allow signing even when isConnected is false (wallet might be locked)
    if (!publicKey) {
      handleError(new Error('No account selected'), 'Please connect your wallet first');
      return null;
    }

    try {
      const result = await provider.signBlock(block);
      return result;
    } catch (err: unknown) {
      handleError(err, 'Failed to sign block');
      return null;
    }
  }, [provider, publicKey, handleError]);

  const sendBlock = useCallback(async (block: Block): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }
    
    // Allow sending even when isConnected is false (wallet might be locked)
    if (!publicKey) {
      handleError(new Error('No account selected'), 'Please connect your wallet first');
      return null;
    }

    try {
      const hash = await provider.sendBlock(block);
      return hash;
    } catch (err: unknown) {
      handleError(err, 'Failed to send block');
      return null;
    }
  }, [provider, publicKey, handleError]);

  const resolveBNS = useCallback(async (bnsName: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    try {
      const resolvedAddress = await provider.resolveBNS(bnsName);
      return resolvedAddress;
    } catch (err: unknown) {
      handleError(err, `Failed to resolve BNS name: ${bnsName}`);
      return null;
    }
  }, [provider, handleError]);

  const value: MonkeyMaskContextType = {
    // Connection state
    isConnected,
    isConnecting,
    publicKey,
    accounts,
    
    // Core actions
    connect,
    disconnect,
    
    // Account methods
    getAccounts,
    getBalance,
    getAccountInfo,
    
    // Transaction methods
    sendTransaction,
    signMessage,
    signBlock,
    sendBlock,
    
    // Utility methods
    resolveBNS,
    
    // Error handling
    error,
    clearError,
    
    // Extension status
    isInstalled,
  };

  return (
    <MonkeyMaskContext.Provider value={value}>
      {children}
    </MonkeyMaskContext.Provider>
  );
}

// Custom hook for using MonkeyMask
export function useMonkeyMask(): MonkeyMaskContextType {
  const context = useContext(MonkeyMaskContext);
  if (!context) {
    throw new Error('useMonkeyMask must be used within a MonkeyMaskProvider');
  }
  return context;
}

// Export types for developers
export type { MonkeyMaskContextType };
