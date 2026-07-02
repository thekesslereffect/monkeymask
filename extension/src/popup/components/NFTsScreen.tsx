import React, { useCallback, useEffect, useState } from 'react';
import { Header, Card, ContentContainer, Footer, PageName, EmptyState } from './ui';
import { Icon } from '@iconify/react';
import { useAccounts } from '../hooks/useAccounts';
import { NFTCard } from './NFTCard';
import { NFTDetail } from './NFTDetail';
import type { MonkeyNFT } from '../../utils/nft';

// Module-level cache keyed by address. Persists across in-popup screen changes
// (NFTs -> Dashboard -> NFTs) so we don't refetch every time the tab is opened.
// Mirrors the website's gallery cache. Cleared when the popup is closed.
interface CacheEntry {
  nfts: MonkeyNFT[];
  error: string | null;
  fetchedAt: number;
}
const CACHE_TTL_MS = 60_000;
const nftCache = new Map<string, CacheEntry>();

/** Invalidate the cached NFT list for an address (or all addresses). */
export function invalidateExtensionNftCache(address?: string): void {
  if (address) nftCache.delete(address);
  else nftCache.clear();
}

export const NFTsScreen: React.FC = () => {
  const { currentAccount } = useAccounts();
  const address = currentAccount?.address;
  const cached = address ? nftCache.get(address) : undefined;

  const [nfts, setNfts] = useState<MonkeyNFT[]>(cached?.nfts ?? []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(cached?.error ?? null);
  const [selected, setSelected] = useState<MonkeyNFT | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadNFTs = async () => {
      if (!address) {
        setLoading(false);
        return;
      }

      // Serve fresh cache immediately; only show the skeleton on a cold load.
      const entry = nftCache.get(address);
      const isFresh = entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;
      if (entry) {
        setNfts(entry.nfts);
        setError(entry.error);
      }
      if (isFresh) {
        setLoading(false);
        return;
      }

      setLoading(!entry);
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_NFTS', address });
        if (cancelled) return;
        if (response?.success) {
          const data: MonkeyNFT[] = response.data.nfts || [];
          const err: string | null = response.data.error || null;
          nftCache.set(address, { nfts: data, error: err, fetchedAt: Date.now() });
          setNfts(data);
          setError(err);
        } else {
          setError(response?.error || 'Failed to load NFTs');
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load NFTs');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadNFTs();
    return () => {
      cancelled = true;
    };
  }, [address]);

  const handleNFTClick = (nft: MonkeyNFT) => setSelected(nft);

  const reloadNfts = useCallback(async () => {
    if (!address) return;
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_NFTS', address });
      if (response?.success) {
        const data: MonkeyNFT[] = response.data.nfts || [];
        const err: string | null = response.data.error || null;
        nftCache.set(address, { nfts: data, error: err, fetchedAt: Date.now() });
        setNfts(data);
        setError(err);
      }
    } catch {
      // best-effort refresh; keep the current list on failure
    }
  }, [address]);

  const handleTransferred = useCallback(
    (assetRep: string) => {
      // Optimistically drop the transferred NFT, then revalidate once the
      // crawler has had a moment to trace the send#asset.
      setNfts((prev) => prev.filter((n) => (n.assetRepresentative ?? n.id) !== assetRep));
      if (address) invalidateExtensionNftCache(address);
      setSelected(null);
      setTimeout(() => {
        void reloadNfts();
      }, 2500);
    },
    [address, reloadNfts],
  );

  const renderBody = () => {
    if (loading && nfts.length === 0) {
      return (
        <div className="grid grid-cols-2 gap-3 w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-tertiary/10 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    if (nfts.length === 0) {
      return (
        <EmptyState
          icon={error ? 'lucide:wifi-off' : 'lucide:image'}
          title={error ? "Couldn't load NFTs" : 'No NFTs found'}
          description={
            error
              ? 'The Banano NFT service is unavailable right now. Please try again later.'
              : 'Banano NFTs owned by this account will appear here.'
          }
        />
      );
    }

    return (
      <div className="w-full space-y-4">
        <div className="text-center text-tertiary">
          {nfts.length} NFT{nfts.length !== 1 ? 's' : ''}
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {nfts.map((nft) => (
            <NFTCard key={nft.id} nft={nft} onClick={handleNFTClick} />
          ))}
        </div>
        {error && (
          <Card className="mt-2">
            <div className="flex items-center space-x-3 p-2">
              <Icon icon="lucide:info" className="text-primary text-lg" />
              <div className="text-xs text-tertiary/70">
                Some NFTs may be missing while the Banano NFT service is degraded.
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col font-semibold relative">
      <Header active={true} />
      <ContentContainer>
        <PageName name="NFTs" back={true} />
        {renderBody()}
      </ContentContainer>
      <Footer />
      {selected && (
        <NFTDetail
          nft={selected}
          onClose={() => setSelected(null)}
          fromAddress={address}
          onTransferred={handleTransferred}
        />
      )}
    </div>
  );
};
