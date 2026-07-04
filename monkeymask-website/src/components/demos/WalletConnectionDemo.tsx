'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { ConnectButton } from '@/components/ConnectButton';
import { BALANCES_CHANGED_EVENT, serializeSignInOutput } from '@monkeymask/wallet-standard';
import { Button, Badge } from '@/components/ui';

/**
 * Self-contained wallet connection + balance + Sign In With Banano demo.
 */
export function WalletConnectionDemo() {
  const { connected, publicKey, getAccountInfo, signIn, clearError } = useMonkeyMask();

  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const truncatedKey = useMemo(() => {
    if (!publicKey) return null;
    return `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`;
  }, [publicKey]);

  const refreshBalance = useCallback(async () => {
    if (!connected) return;
    setLoadingBalance(true);
    try {
      const info = await getAccountInfo();
      const balanceValue = info?.balance;
      setBalance(typeof balanceValue === 'string' ? balanceValue : null);
    } catch (err) {
      setBalance(null);
      console.error('Failed to get balance:', err);
    } finally {
      setLoadingBalance(false);
    }
  }, [getAccountInfo, connected]);

  useEffect(() => {
    if (connected) {
      refreshBalance();
    } else {
      setBalance(null);
      setAuthStatus(null);
    }
  }, [connected, refreshBalance]);

  // The extension dispatches this DOM event after any block publish (send,
  // receive, NFT ops) so the balance stays live without polling.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ addresses?: string[] }>).detail;
      if (!publicKey) return;
      if (detail?.addresses && !detail.addresses.includes(publicKey)) return;
      void refreshBalance();
    };
    window.addEventListener(BALANCES_CHANGED_EVENT, handler);
    return () => window.removeEventListener(BALANCES_CHANGED_EVENT, handler);
  }, [publicKey, refreshBalance]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthStatus(null);
    clearError();
    try {
      const domain = window.location.host;
      const nonceRes = await fetch(`/api/auth/nonce?domain=${encodeURIComponent(domain)}`);
      const input = await nonceRes.json();
      const output = await signIn(input);
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { ...input, address: output.account.address },
          output: serializeSignInOutput(output),
        }),
      });
      const result = await verifyRes.json();
      setAuthStatus(result.valid ? `Signed in as ${result.address}` : 'Sign-in verification failed');
    } catch (err) {
      setAuthStatus(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="space-y-4">
      {connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Connected
            </Badge>
          </div>
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Public Key</div>
            <div className="font-mono text-sm bg-[var(--panel)] p-2 rounded border">{truncatedKey}</div>
          </div>
          <div>
            <div className="text-sm text-[var(--text-secondary)] mb-1">Balance</div>
            <div className="flex items-center gap-2">
              <div className="font-mono text-lg font-semibold">
                {loadingBalance ? 'Loading...' : balance ? `${balance} BAN` : '0 BAN'}
              </div>
              <Button onClick={refreshBalance} variant="secondary" size="sm" disabled={loadingBalance}>
                <Icon icon="mdi:refresh" className="size-4" />
              </Button>
            </div>
          </div>
          <Button onClick={() => void handleSignIn()} disabled={signingIn} variant="secondary" size="md">
            {signingIn ? 'Signing in...' : 'Sign In With Banano'}
          </Button>
          {authStatus && <p className="text-sm text-green-700">{authStatus}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">Connect your MonkeyMask wallet to try all features</p>
          <ConnectButton />
        </div>
      )}
    </div>
  );
}

export default WalletConnectionDemo;
