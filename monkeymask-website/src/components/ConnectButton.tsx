'use client';

import React, { useState, useEffect } from 'react';
import { useMonkeyMask } from '@/providers';
import { Button } from '@/components/ui';

interface ConnectButtonProps {
  className?: string;
}

export function ConnectButton({ className = '' }: ConnectButtonProps) {
  const {
    isInstalled,
    isConnected,
    isConnecting,
    publicKey,
    connect,
    disconnect,
    error,
    clearError,
  } = useMonkeyMask();

  const [previousPublicKey, setPreviousPublicKey] = useState<string | null>(null);
  const [isAccountSwitching, setIsAccountSwitching] = useState(false);

  // Detect account switching
  useEffect(() => {
    if (publicKey && previousPublicKey && publicKey !== previousPublicKey) {
      setIsAccountSwitching(true);
      console.log('dApp: Account switch detected:', previousPublicKey, '->', publicKey);
      
      // Clear the switching state after a short delay
      const timer = setTimeout(() => {
        setIsAccountSwitching(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
    
    if (publicKey) {
      setPreviousPublicKey(publicKey);
    }
  }, [publicKey, previousPublicKey]);

  const onConnect = async () => {
    clearError();
    await connect();
  };

  const onDisconnect = async () => {
    await disconnect();
  };

  if (!isInstalled) {
    return (
      <a href="/docs#install" className={className}>
        <Button variant="secondary" size="md">Get MonkeyMask</Button>
      </a>
    );
  }

  if (error) {
    return (
      <Button onClick={clearError} className={className} variant="secondary" size="md">
        Error — Dismiss
      </Button>
    );
  }

  if (isConnected && publicKey) {
    return (
      <Button 
        onClick={onDisconnect} 
        className={className} 
        variant="secondary" 
        size="md"
        disabled={isAccountSwitching}
      >
        {isAccountSwitching ? (
          <span className="flex items-center gap-2">
            <span className="animate-pulse">🔄</span>
            Account Switched
          </span>
        ) : (
          `${publicKey.slice(0, 6)}...${publicKey.slice(-6)}`
        )}
      </Button>
    );
  }

  return (
    <Button onClick={onConnect} disabled={isConnecting} className={className} variant="secondary" size="md">
      {isConnecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  );
}


