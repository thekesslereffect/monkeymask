'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask } from '@/providers';
import { serializeSignInOutput } from '@monkeymask/wallet-standard';
import { ConnectButton } from '@/components/ConnectButton';
import { Button, StatusBox } from '@/components/ui';

const FIELD_CLASS = 'w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm';

interface UnlockedContent {
  secret: string;
  perk: string;
  unlockedFor: string;
  unlockedAt: string;
}

interface MatchedNft {
  name: string;
  image?: string;
  metadataCid?: string;
  heldCount?: number;
}

type GateResult =
  | { status: 'unlocked'; content: UnlockedContent; matched: MatchedNft[] }
  | { status: 'denied'; requiredCollection: string | null; requiredIssuer: string | null }
  | { status: 'error'; message: string };

/**
 * NFT gating demo: prove account control with Sign In With Banano, then unlock
 * content only holders of a collection can see. Ownership is verified
 * server-side against the signed-in address, read crawler-free from the chain.
 */
export function NftGateDemo() {
  const { connected, publicKey, signIn, clearError } = useMonkeyMask();

  const [sessionAddress, setSessionAddress] = useState<string | null>(null);
  const [collection, setCollection] = useState('');
  const [issuer, setIssuer] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<GateResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      setSessionAddress(typeof data.address === 'string' ? data.address : null);
    } catch {
      setSessionAddress(null);
    }
  }, []);

  useEffect(() => {
    if (connected) {
      void refreshSession();
    } else {
      setSessionAddress(null);
      setResult(null);
    }
  }, [connected, publicKey, refreshSession]);

  // A session bound to a different account than the one now connected must be
  // re-established so the gate always checks the account you actually hold.
  const signedInForCurrent = !!sessionAddress && !!publicKey && sessionAddress === publicKey;

  const handleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    setResult(null);
    clearError();
    try {
      const domain = window.location.host;
      const nonceRes = await fetch(`/api/auth/nonce?domain=${encodeURIComponent(domain)}`);
      const input = await nonceRes.json();
      const output = await signIn(input);
      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          input: { ...input, address: output.account.address },
          output: serializeSignInOutput(output),
        }),
      });
      const data = await verifyRes.json();
      if (!data.valid) throw new Error(data.error || 'Sign-in verification failed');
      setSessionAddress(data.address as string);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSigningIn(false);
    }
  };

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);
    try {
      const params = new URLSearchParams();
      const cid = collection.trim();
      const issuerAddr = issuer.trim();
      if (cid) params.set('collection', cid);
      if (issuerAddr) params.set('issuer', issuerAddr);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await fetch(`/api/gated${query}`, { credentials: 'include' });
      const data = await res.json();
      if (res.status === 401) {
        setSessionAddress(null);
        setResult({ status: 'error', message: 'Session expired. Sign in again.' });
        return;
      }
      if (data.unlocked) {
        setResult({ status: 'unlocked', content: data.content, matched: data.matched ?? [] });
      } else if (data.reason === 'no_nft') {
        setResult({
          status: 'denied',
          requiredCollection: data.requiredCollection ?? null,
          requiredIssuer: data.requiredIssuer ?? null,
        });
      } else {
        setResult({ status: 'error', message: data.error || 'Access check failed' });
      }
    } catch (err) {
      setResult({ status: 'error', message: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setChecking(false);
    }
  };

  if (!connected) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-[var(--text-secondary)]">
          Connect your wallet to try NFT gating.
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-secondary)]">
        Prove you control your account (Sign In With Banano), then unlock content only holders of a
        collection can see. For a strong gate, set both the metadata CID and the issuer address: the
        server verifies the mint block was published on that issuer&apos;s chain, so copies minted by
        someone else with the same CID do not pass.
      </p>

      {!signedInForCurrent ? (
        <>
          <Button
            onClick={() => void handleSignIn()}
            disabled={signingIn}
            size="sm"
            variant="secondary"
          >
            {signingIn ? (
              <>
                <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                Signing in...
              </>
            ) : (
              'Sign In With Banano'
            )}
          </Button>
          {sessionAddress && (
            <StatusBox variant="info">
              You&apos;re signed in with a different account. Sign in again to gate the account you
              switched to.
            </StatusBox>
          )}
          {authError && (
            <StatusBox variant="error" title="Sign-in failed">
              {authError}
            </StatusBox>
          )}
        </>
      ) : (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">
              Required collection CID (optional)
            </label>
            <input
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="Qm... (leave blank = any NFT unlocks)"
              disabled={checking}
              className={`${FIELD_CLASS} font-mono`}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Mint an NFT in the Mint demo, copy its <span className="font-mono">metadata</span> CID,
              and paste it here.
            </p>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="text-sm font-medium">Issuer address (recommended)</label>
              {publicKey && (
                <button
                  type="button"
                  onClick={() => setIssuer(publicKey)}
                  disabled={checking}
                  className="text-xs text-[var(--text-secondary)] underline hover:text-foreground disabled:opacity-50"
                >
                  Use my address
                </button>
              )}
            </div>
            <input
              type="text"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              placeholder="ban_1... (minting account for the collection)"
              disabled={checking}
              className={`${FIELD_CLASS} font-mono`}
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              If you minted to yourself, use your connected address. The gate checks on-chain that your
              NFT&apos;s mint block was published on this account, not a forger&apos;s.
            </p>
          </div>

          <Button
            onClick={() => void handleCheck()}
            disabled={checking}
            size="sm"
            variant="secondary"
          >
            {checking ? (
              <>
                <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                Checking ownership...
              </>
            ) : (
              'Unlock content'
            )}
          </Button>

          {result?.status === 'unlocked' && (
            <StatusBox variant="success" title="Unlocked">
              <div className="space-y-2">
                <p>{result.content.secret}</p>
                <a
                  className="underline"
                  href={result.content.perk}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open members-only link
                </a>
                {result.matched.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {result.matched.slice(0, 6).map((nft, i) => (
                      <div key={i} className="flex items-center gap-1">
                        {nft.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={nft.image}
                            alt={nft.name}
                            className="size-6 rounded object-cover border border-green-200"
                            loading="lazy"
                          />
                        )}
                        <span className="max-w-[8rem] truncate">{nft.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </StatusBox>
          )}
          {result?.status === 'denied' && (
            <StatusBox variant="error" title="Locked">
              {result.requiredCollection && result.requiredIssuer
                ? 'No held NFT from that collection minted by the specified issuer. Copies minted by other accounts with the same CID do not count.'
                : result.requiredCollection
                  ? 'This account does not hold the required collection. Mint or acquire it, then try again.'
                  : result.requiredIssuer
                    ? 'This account holds no NFTs minted by the specified issuer.'
                    : 'This account holds no NFTs yet. Mint one in the Mint demo, then unlock.'}
            </StatusBox>
          )}
          {result?.status === 'error' && (
            <StatusBox variant="error" title="Error">
              {result.message}
            </StatusBox>
          )}
        </>
      )}
    </div>
  );
}

export default NftGateDemo;
