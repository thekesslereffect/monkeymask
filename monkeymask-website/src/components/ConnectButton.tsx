'use client';

import React, { useState, useEffect } from 'react';
import { useMonkeyMask } from '@/providers';
import { Button } from '@/components/ui';

interface ConnectButtonProps {
  className?: string;
}

export function ConnectButton({ className = '' }: ConnectButtonProps) {
  const {
    installed,
    connected,
    connecting,
    publicKey,
    connect,
    disconnect,
    error,
    clearError,
  } = useMonkeyMask();

  const [previousPublicKey, setPreviousPublicKey] = useState<string | null>(null);
  const [isAccountSwitching, setIsAccountSwitching] = useState(false);

  useEffect(() => {
    if (publicKey && previousPublicKey && publicKey !== previousPublicKey) {
      setIsAccountSwitching(true);
      const timer = setTimeout(() => setIsAccountSwitching(false), 1500);
      return () => clearTimeout(timer);
    }
    if (publicKey) setPreviousPublicKey(publicKey);
  }, [publicKey, previousPublicKey]);

  if (!installed) {
    return (
      <a href="/docs" className={className}>
        <Button variant="secondary" size="md">Get MonkeyMask</Button>
      </a>
    );
  }

  if (error) {
    return (
      <Button onClick={clearError} className={className} variant="secondary" size="md">
        Dismiss error
      </Button>
    );
  }

  if (connected && publicKey) {
    return (
      <Button
        onClick={() => void disconnect()}
        className={className}
        variant="secondary"
        size="md"
        disabled={isAccountSwitching}
      >
        {isAccountSwitching ? 'Switching...' : `${publicKey.slice(0, 8)}...${publicKey.slice(-6)}`}
      </Button>
    );
  }

  return (
    <Button onClick={() => void connect()} className={className} variant="default" size="md" disabled={connecting}>
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
