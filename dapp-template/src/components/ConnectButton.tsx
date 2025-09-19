'use client';

import React from 'react';
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
        <Button variant="secondary" size="lg">Install MonkeyMask</Button>
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
      <Button onClick={onDisconnect} className={className} variant="secondary" size="md">
        {publicKey.slice(0, 6)}...{publicKey.slice(-6)}
      </Button>
    );
  }

  return (
    <Button onClick={onConnect} disabled={isConnecting} className={className} variant="secondary" size="md">
      {isConnecting ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  );
}


