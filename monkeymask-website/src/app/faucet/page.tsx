'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { serializeSignInOutput } from '@monkeymask/wallet-standard';
import { Header } from '@/components/pages/Header';
import { Footer } from '@/components/pages/Footer';
import { Button, StatusBox } from '@/components/ui';
import { ConnectButton } from '@/components/ConnectButton';
import { MonkeyLogo } from '@/components/MonkeyLogo';
import { useMonkeyMask } from '@/providers';

interface FaucetStatus {
  enabled: boolean;
  address?: string;
  balance?: string | null;
  claimAmountBan?: string;
  cooldownMs?: number;
  sessionAddress?: string | null;
  retryAfterMs?: number | null;
}

function truncateAddress(address: string, head = 12, tail = 8): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export default function FaucetPage() {
  const { connected, publicKey, signIn, clearError } = useMonkeyMask();

  const [status, setStatus] = useState<FaucetStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [claimResult, setClaimResult] = useState<{ hash: string; amountBan: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAfterMs, setRetryAfterMs] = useState<number | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/faucet', { cache: 'no-store' });
      const data = (await res.json()) as FaucetStatus;
      setStatus(data);
      setRetryAfterMs(data.retryAfterMs ?? null);
    } catch {
      setStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  // Tick the cooldown countdown down once per second.
  useEffect(() => {
    if (!retryAfterMs || retryAfterMs <= 0) return;
    const interval = setInterval(() => {
      setRetryAfterMs((ms) => (ms && ms > 1000 ? ms - 1000 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [retryAfterMs]);

  const signedIn = Boolean(
    status?.sessionAddress && publicKey && status.sessionAddress === publicKey,
  );

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
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
      if (!result.valid) throw new Error(result.error || 'Sign-in verification failed');
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    setClaimResult(null);
    try {
      const res = await fetch('/api/faucet/claim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.retryAfterMs === 'number') setRetryAfterMs(data.retryAfterMs);
        throw new Error(
          typeof data.retryAfterMs === 'number'
            ? `You can claim again in ${formatCountdown(data.retryAfterMs)}`
            : data.error || 'Claim failed',
        );
      }
      setClaimResult({ hash: data.hash, amountBan: data.amountBan });
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed');
    } finally {
      setClaiming(false);
    }
  };

  const handleCopy = async () => {
    if (!status?.address) return;
    await navigator.clipboard.writeText(status.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onCooldown = retryAfterMs !== null && retryAfterMs > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-4 py-16">
        <div className="flex size-20 items-center justify-center rounded-full bg-black text-white">
          <MonkeyLogo className="size-12" />
        </div>

        <h1 className="mt-8 text-5xl font-bold tracking-tight md:text-6xl">Faucet</h1>
        <p className="mt-3 max-w-md text-center text-muted-foreground">
          Free BAN to get you started. Sign in with your wallet to prove it&apos;s yours, then
          claim once per day.
        </p>

        {loadingStatus ? (
          <div className="mt-12 text-muted-foreground">Loading faucet…</div>
        ) : !status?.enabled ? (
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-xl font-semibold text-muted-foreground">Coming soon</p>
            <Button variant="outline" size="md" asChild>
              <Link href="/">
                <Icon icon="mdi:arrow-left" className="size-5" />
                <span>Back home</span>
              </Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 w-full space-y-6">
            {/* Faucet stats */}
            <div className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Faucet balance</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {status.balance != null ? `${parseFloat(status.balance).toFixed(2)} BAN` : '—'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Per claim</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {status.claimAmountBan} BAN
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-border pt-4">
                <div className="text-sm text-muted-foreground">
                  Faucet address — donations top it up for everyone
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="mt-1 flex items-center gap-2 font-mono text-sm text-foreground hover:text-muted-foreground"
                  title="Copy address"
                >
                  {truncateAddress(status.address ?? '')}
                  <Icon icon={copied ? 'mdi:check' : 'mdi:content-copy'} className="size-4" />
                </button>
              </div>
            </div>

            {/* Claim flow */}
            <div className="flex flex-col items-center gap-3">
              {!connected ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Connect your MonkeyMask wallet to claim
                  </p>
                  <ConnectButton />
                </>
              ) : !signedIn ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Sign in to prove you own this address — no funds move
                  </p>
                  <Button
                    onClick={() => void handleSignIn()}
                    disabled={signingIn}
                    variant="default"
                    size="lg"
                  >
                    {signingIn ? 'Waiting for wallet…' : 'Sign In With Banano'}
                  </Button>
                </>
              ) : onCooldown ? (
                <Button variant="secondary" size="lg" disabled>
                  <Icon icon="mdi:clock-outline" className="size-5" />
                  <span>Claim again in {formatCountdown(retryAfterMs)}</span>
                </Button>
              ) : (
                <Button
                  onClick={() => void handleClaim()}
                  disabled={claiming}
                  variant="default"
                  size="lg"
                >
                  {claiming ? 'Sending…' : `Claim ${status.claimAmountBan} BAN`}
                </Button>
              )}
              {signedIn && publicKey && (
                <p className="text-xs text-muted-foreground">
                  Claiming to <span className="font-mono">{truncateAddress(publicKey)}</span>
                </p>
              )}
            </div>

            {claimResult && (
              <StatusBox variant="success" title={`Sent ${claimResult.amountBan} BAN!`} mono>
                <a
                  href={`https://creeper.banano.cc/hash/${claimResult.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {claimResult.hash}
                </a>
              </StatusBox>
            )}
            {error && <StatusBox variant="error">{error}</StatusBox>}

            <p className="text-center text-xs text-muted-foreground">
              One claim per address and per IP per 24 hours. Be kind — it&apos;s a shared banana
              stash.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
