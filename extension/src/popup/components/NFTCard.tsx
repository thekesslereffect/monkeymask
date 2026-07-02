import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { MonkeyNFT } from '../../utils/nft';

interface NFTCardProps {
  nft: MonkeyNFT;
  onClick?: (nft: MonkeyNFT) => void;
}

/** Short supply label for a collection tile. */
export function nftSupplyBadge(nft: MonkeyNFT): { label: string; icon: string } | null {
  if (!nft.supplyType) return null;
  const held = nft.heldCount ?? 0;
  const minted = nft.mintedCount ?? held;
  if (nft.supplyType === 'unique') return { label: '1/1', icon: 'lucide:gem' };
  if (nft.supplyType === 'unlimited') {
    return { label: held > 1 ? `∞ ·${held}` : '∞', icon: 'lucide:infinity' };
  }
  return { label: `${minted}/${nft.maxSupply}`, icon: 'lucide:layers' };
}

/** Square collectible tile with graceful image fallback. */
export const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = nft.image && !imageFailed;
  const badge = nftSupplyBadge(nft);
  const held = nft.heldCount ?? 0;

  return (
    <div
      onClick={onClick ? () => onClick(nft) : undefined}
      className={`bg-card rounded-xl overflow-hidden aspect-square flex flex-col ${
        onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
      }`}
    >
      <div className="relative flex-1 flex items-center justify-center bg-tertiary/10 overflow-hidden">
        {showImage ? (
          <img
            src={nft.image}
            alt={nft.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Icon icon="lucide:image" className="text-4xl text-tertiary/50" />
        )}
        {badge && (
          <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-white">
            <Icon icon={badge.icon} className="text-[10px]" />
            {badge.label}
          </span>
        )}
        {held > 1 && (
          <span className="absolute top-1 right-1 inline-flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
            x{held}
          </span>
        )}
      </div>
      <div className="p-2 space-y-0.5">
        <div className="text-xs font-semibold text-primary truncate">{nft.name}</div>
        {nft.collection && <div className="text-[10px] text-tertiary/70 truncate">{nft.collection}</div>}
      </div>
    </div>
  );
};
