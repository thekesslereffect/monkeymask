import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import type { MonkeyNFT } from '../../utils/nft';

interface NFTCardProps {
  nft: MonkeyNFT;
  onClick?: (nft: MonkeyNFT) => void;
}

/** Short supply label for a gallery tile. */
export function nftSupplyBadge(
  nft: MonkeyNFT,
  opts?: { includeHeld?: boolean },
): { label: string; icon: string } | null {
  if (!nft.supplyType) return null;
  const held = nft.heldCount ?? 0;
  const minted = nft.mintedCount ?? held;
  const heldSuffix = opts?.includeHeld && held > 1 ? ` · ×${held}` : '';

  if (nft.supplyType === 'unique') {
    return { label: `1 of 1${heldSuffix}`, icon: 'lucide:gem' };
  }
  if (nft.supplyType === 'unlimited') {
    return {
      label: held > 1 && !opts?.includeHeld ? `Unlimited · ×${held}` : `Unlimited${heldSuffix}`,
      icon: 'lucide:infinity',
    };
  }
  return { label: `Limited ${minted}/${nft.maxSupply}${heldSuffix}`, icon: 'lucide:layers' };
}

/** Image-only collectible tile with a supply badge overlay. */
export const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = nft.image && !imageFailed;
  const badge = nftSupplyBadge(nft, { includeHeld: true });

  return (
    <button
      type="button"
      onClick={onClick ? () => onClick(nft) : undefined}
      disabled={!onClick}
      aria-label={nft.name}
      className={`group relative aspect-square w-full overflow-hidden rounded-xl border border-tertiary/15 bg-tertiary/10 transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:ring-2 hover:ring-tertiary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
          : 'cursor-default'
      }`}
    >
      {showImage ? (
        <img
          src={nft.image}
          alt=""
          className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Icon icon="lucide:image" className="text-4xl text-tertiary/50" />
        </div>
      )}

      {badge && (
        <span className="absolute bottom-1.5 left-1.5 inline-flex max-w-[calc(100%-0.75rem)] items-center gap-0.5 rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur-sm">
          <Icon icon={badge.icon} className="shrink-0 text-[10px]" />
          <span className="truncate">{badge.label}</span>
        </span>
      )}
    </button>
  );
};
