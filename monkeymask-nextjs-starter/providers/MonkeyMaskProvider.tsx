'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react';
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
  signMessage: (message: string, encoding?: 'utf8' | 'hex') => Promise<string | null>;
  verifySignedMessage: (message: string, signatureHex: string, publicKey?: string, encoding?: 'utf8' | 'hex') => Promise<boolean | null>;
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
  const accountInfoCacheRef = useRef(new Map<string, { ts: number; data: AccountInfo }>());
  const accountInfoInFlightRef = useRef(new Map<string, Promise<AccountInfo>>());
  const ACCOUNT_INFO_TTL_MS = 5000;

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

  // Initialize provider (guarded to avoid duplicate listeners/logs)
  useEffect(() => {
    const initializedRef = { current: false } as { current: boolean };

    const initializeProvider = () => {
      if (initializedRef.current) return;
      if (typeof window !== 'undefined' && window.banano) {
        initializedRef.current = true;
        setProvider(window.banano);
        setIsInstalled(true);
        
        // Set up event listeners (no noisy logs)
        window.banano.on('connect', (data: { publicKey: string; accounts?: string[] }) => {
          console.log('dApp: Wallet connected:', data.publicKey);
          setIsConnected(true);
          setPublicKey(data.publicKey);
          setAccounts(data.accounts || [data.publicKey]);
          setUserDisconnected(false); // Reset disconnect flag when successfully connected
          clearError();
          
          // Clear account info cache when connecting to a new account
          accountInfoCacheRef.current.clear();
          
          onConnect?.(data.publicKey);
        });

        window.banano.on('disconnect', () => {
          console.log('dApp: Wallet disconnected');
          setIsConnected(false);
          setPublicKey(null);
          setAccounts([]);
          
          // Clear account info cache on disconnect
          accountInfoCacheRef.current.clear();
          
          // Don't reset userDisconnected flag here - it should persist
          onDisconnect?.();
        });

        window.banano.on('accountChanged', (newPublicKey: string) => {
          console.log('dApp: Account changed to:', newPublicKey);
          
          // Note: This event is for backward compatibility
          // The new per-account permission system uses disconnect -> connect flow instead
          // But if we receive this event, treat it as a connected account change
          
          setIsConnected(true);
          setPublicKey(newPublicKey);
          setAccounts([newPublicKey]);
          
          // Clear account info cache when switching accounts
          accountInfoCacheRef.current.clear();
          
          // Treat account change as a new connection
          onConnect?.(newPublicKey);
        });

        // Don't seed state immediately - let the provider's silentReconnect() handle it
        // The provider will emit 'connect' events if there's an existing connection
        // This ensures we get the currently selected account, not stale cached data
      } else {
        setIsInstalled(false);
      }
    };

    // Try to initialize with retries (max 3) without spamming logs
    let retryCount = 0;
    const maxRetries = 3;
    const tryInitialize = () => {
      initializeProvider();
      if (!initializedRef.current && retryCount < maxRetries) {
        retryCount++;
        setTimeout(tryInitialize, 500);
      }
    };

    tryInitialize();
  // Only run on mount; callbacks are stable by reference in this context
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-connect on load (but not if user manually disconnected)
  // Only auto-connect if the user has previously connected to this site
  useEffect(() => {
    if (autoConnect && provider && !userDisconnected) {
      const timeoutId = setTimeout(() => {
        // Let injected provider's silent reconnection happen first (~500ms)
        if (provider && !provider.isConnected) {
          provider.connect({ onlyIfTrusted: true }).catch(() => {
            // Silent fallback: skip logging
          });
        }
      }, 800);
      return () => clearTimeout(timeoutId);
    }
  }, [autoConnect, provider, userDisconnected]);

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

  const getAccountInfo = useCallback(async (address?: string): Promise<AccountInfo | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    try {
      const target = address || publicKey || '';
      if (!target) return null;

      const cached = accountInfoCacheRef.current.get(target);
      if (cached && Date.now() - cached.ts < ACCOUNT_INFO_TTL_MS) {
        return cached.data;
      }

      // Deduplicate concurrent requests
      const existingPromise = accountInfoInFlightRef.current.get(target);
      if (existingPromise) {
        const data = await existingPromise;
        return data;
      }

      const p = provider.getAccountInfo(target).then((data) => {
        accountInfoCacheRef.current.set(target, { ts: Date.now(), data });
        accountInfoInFlightRef.current.delete(target);
        return data;
      }).catch((e) => {
        accountInfoInFlightRef.current.delete(target);
        throw e;
      });

      accountInfoInFlightRef.current.set(target, p);
      const data = await p;
      return data;
    } catch (err: unknown) {
      handleError(err, 'Failed to get account info');
      return null;
    }
  }, [provider, handleError, publicKey]);

  const getBalance = useCallback(async (address?: string): Promise<string | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    try {
      // Reuse account info cache to avoid duplicate calls and logs
      const target = address || publicKey || '';
      if (!target) return null;

      const cached = accountInfoCacheRef.current.get(target);
      if (cached && Date.now() - cached.ts < ACCOUNT_INFO_TTL_MS) {
        return cached.data.balance;
      }

      const info = await getAccountInfo(target);
      return info?.balance ?? null;
    } catch (err: unknown) {
      handleError(err, 'Failed to get balance');
      return null;
    }
  }, [provider, handleError, publicKey, getAccountInfo]);

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

  const signMessage = useCallback(async (message: string, encoding: 'utf8' | 'hex' = 'utf8'): Promise<string | null> => {
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
      const result = await provider.signMessage(message, encoding);
      // Convert Uint8Array to hex string for easier handling
      return Array.from(result.signature, byte => byte.toString(16).padStart(2, '0')).join('');
    } catch (err: unknown) {
      handleError(err, 'Failed to sign message');
      return null;
    }
  }, [provider, publicKey, handleError]);

  const verifySignedMessage = useCallback(async (message: string, signatureHex: string, publicKeyParam?: string, encoding: 'utf8' | 'hex' = 'utf8'): Promise<boolean | null> => {
    if (!provider) {
      handleError(new Error('MonkeyMask not installed'), 'MonkeyMask extension not found');
      return null;
    }

    // Use provided publicKey or fall back to connected account's publicKey
    const keyToUse = publicKeyParam || publicKey;
    if (!keyToUse) {
      handleError(new Error('No account selected'), 'Please connect your wallet first');
      return null;
    }

    try {
      console.log('dApp: Calling verifySignedMessage with:', { message, signatureHex, keyToUse, encoding });
      const isValid = await provider.verifySignedMessage(message, signatureHex, keyToUse, encoding);
      console.log('dApp: Verification result:', isValid);
      return isValid;
    } catch (err: unknown) {
      handleError(err, 'Failed to verify signed message');
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
    verifySignedMessage,
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
