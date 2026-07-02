'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useMonkeyMask, useSendAllNfts } from '@/providers';
import { Button, StatusBox } from '@/components/ui';
import type { NormalizedNFT } from '@/lib/nft';
import { NftDetailModal } from '@/components/NftDetailModal';

/** Short supply label, e.g. "1 of 1", "Limited 3/10", "Unlimited (x2)". */
export function supplyBadge(nft: {
  supplyType?: 'unique' | 'limited' | 'unlimited';
  maxSupply?: number;
  mintedCount?: number;
  heldCount?: number;
}): { label: string; icon: string } | null {
  if (!nft.supplyType) return null;
  const held = nft.heldCount ?? 0;
  const minted = nft.mintedCount ?? held;
  if (nft.supplyType === 'unique') return { label: '1 of 1', icon: 'lucide:gem' };
  if (nft.supplyType === 'unlimited') {
    return { label: held > 1 ? `Unlimited · hold ${held}` : 'Unlimited', icon: 'lucide:infinity' };
  }
  return { label: `Limited ${minted}/${nft.maxSupply}`, icon: 'lucide:layers' };
}

function NftTile({ nft, onSelect }: { nft: NormalizedNFT; onSelect: (nft: NormalizedNFT) => void }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = nft.image && !imageFailed;
  const badge = supplyBadge(nft);
  const held = nft.heldCount ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(nft)}
      className="text-left rounded-md border border-[var(--border)] overflow-hidden bg-white hover:shadow-md transition-shadow"
    >
      <div className="relative aspect-square flex items-center justify-center bg-secondary overflow-hidden">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon icon="lucide:image" className="size-10 text-muted-foreground" />
        )}
        {badge && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <Icon icon={badge.icon} className="size-3" />
            {badge.label}
          </span>
        )}
        {held > 1 && (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            x{held}
          </span>
        )}
      </div>
      <div className="p-2">
        <div className="text-sm font-semibold truncate">{nft.name}</div>
        {nft.collection && (
          <div className="text-xs text-[var(--text-secondary)] truncate">{nft.collection}</div>
        )}
      </div>
    </button>
  );
}

interface CacheEntry {
  nfts: NormalizedNFT[];
  error: string | null;
  ts: number;
}

// Module-level cache survives component unmount/remount (e.g. tab switching),
// so navigating back to the gallery shows results instantly instead of reloading.
const galleryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

/** Drop cached gallery results (e.g. after minting) so the next view revalidates. */
export function invalidateNftCache(address?: string) {
  if (address) galleryCache.delete(address);
  else galleryCache.clear();
}

export function NftGallery() {
  const { connected, publicKey } = useMonkeyMask();
  const cached = publicKey ? galleryCache.get(publicKey) : undefined;
  const [nfts, setNfts] = useState<NormalizedNFT[]>(cached?.nfts ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(cached?.error ?? null);
  const [loaded, setLoaded] = useState(Boolean(cached));
  const [selected, setSelected] = useState<NormalizedNFT | null>(null);

  const sendAllNfts = useSendAllNfts();
  const [showSendAll, setShowSendAll] = useState(false);
  const [sendAllTo, setSendAllTo] = useState('');
  const [sendingAll, setSendingAll] = useState(false);
  const [sendAllError, setSendAllError] = useState<string | null>(null);
  const [sendAllHash, setSendAllHash] = useState<string | null>(null);

  const loadNFTs = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/nfts?address=${encodeURIComponent(publicKey)}`);
      const data = await res.json();
      const nextNfts: NormalizedNFT[] = data.nfts || [];
      const nextError: string | null = data.error || null;
      setNfts(nextNfts);
      setError(nextError);
      galleryCache.set(publicKey, { nfts: nextNfts, error: nextError, ts: Date.now() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NFTs');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [publicKey]);

  const handleSendAll = useCallback(async () => {
    setSendAllError(null);
    if (!sendAllTo.trim()) {
      setSendAllError('Enter a recipient address.');
      return;
    }
    setSendingAll(true);
    try {
      const result = await sendAllNfts({ to: sendAllTo.trim() });
      const hash = typeof result === 'string' ? result : (result as { hash?: string })?.hash ?? '';
      setSendAllHash(hash);
      setSendAllTo('');
      if (publicKey) invalidateNftCache(publicKey);
      setTimeout(() => loadNFTs(), 2500);
    } catch (err) {
      setSendAllError(err instanceof Error ? err.message : 'Send-all failed');
    } finally {
      setSendingAll(false);
    }
  }, [sendAllTo, sendAllNfts, publicKey, loadNFTs]);

  useEffect(() => {
    if (!connected || !publicKey) {
      setNfts([]);
      setLoaded(false);
      setError(null);
      return;
    }
    const entry = galleryCache.get(publicKey);
    if (entry) {
      // Seed from cache immediately; only revalidate if stale.
      setNfts(entry.nfts);
      setError(entry.error);
      setLoaded(true);
      if (Date.now() - entry.ts > CACHE_TTL_MS) loadNFTs();
    } else {
      loadNFTs();
    }
  }, [connected, publicKey, loadNFTs]);

  if (!connected) {
    return (
      <p className="text-[var(--text-secondary)] text-sm">
        Connect your wallet to view the Banano NFTs held by your account.
      </p>
    );
  }

  if (loading && nfts.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-md bg-secondary animate-pulse" />
        ))}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 space-y-2">
        <Icon
          icon={error ? 'lucide:wifi-off' : 'lucide:image'}
          className="size-10 text-muted-foreground"
        />
        <div className="text-sm text-[var(--text-secondary)]">
          {error ? "Couldn't reach the Banano NFT service." : 'No NFTs found for this account.'}
        </div>
        {loaded && (
          <Button variant="secondary" size="sm" onClick={loadNFTs}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-secondary)]">
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant={showSendAll ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setShowSendAll((v) => !v)}
          >
            <Icon icon="lucide:send-horizontal" className="size-4 mr-1" />
            Send all
          </Button>
          <Button variant="secondary" size="sm" onClick={loadNFTs}>
            <Icon icon="mdi:refresh" className="size-4" />
          </Button>
        </div>
      </div>

      {showSendAll && !sendAllHash && (
        <div className="space-y-2 rounded-md border border-[var(--border)] p-3">
          <label className="block text-sm font-medium">
            Send <strong>every</strong> NFT in this account to
          </label>
          <input
            type="text"
            value={sendAllTo}
            onChange={(e) => setSendAllTo(e.target.value)}
            placeholder="ban_1... or name.ban"
            disabled={sendingAll}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-white text-sm"
          />
          <p className="text-xs text-[var(--text-secondary)]">
            One <code>send#all_nfts</code> block transfers all held assets at once. Pending assets
            are pocketed first.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSendAll} disabled={sendingAll}>
              {sendingAll ? (
                <>
                  <Icon icon="mdi:loading" className="size-4 animate-spin mr-2" />
                  Sending…
                </>
              ) : (
                'Send all NFTs'
              )}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowSendAll(false)}
              disabled={sendingAll}
            >
              Cancel
            </Button>
          </div>
          {sendAllError && (
            <StatusBox variant="error" title="Send-all failed">
              {sendAllError}
            </StatusBox>
          )}
        </div>
      )}

      {sendAllHash && (
        <StatusBox variant="success" title="All NFTs sent">
          <a
            className="underline break-all"
            href={`https://creeper.banano.cc/hash/${sendAllHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {sendAllHash.slice(0, 16)}…
          </a>
        </StatusBox>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {nfts.map((nft) => (
          <NftTile key={nft.id} nft={nft} onSelect={setSelected} />
        ))}
      </div>
      {selected && (
        <NftDetailModal
          nft={selected}
          onClose={() => setSelected(null)}
          onTransferred={() => {
            if (publicKey) invalidateNftCache(publicKey);
            // Give the crawler a moment to trace the transfer, then refresh.
            setTimeout(() => loadNFTs(), 2500);
          }}
        />
      )}
    </div>
  );
}

export default NftGallery;
