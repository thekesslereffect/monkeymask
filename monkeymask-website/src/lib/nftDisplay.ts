/** Short supply label for NFT badges, e.g. "1 of 1", "Limited 3/10". */
export function supplyBadge(
  nft: {
    supplyType?: 'unique' | 'limited' | 'unlimited';
    maxSupply?: number;
    mintedCount?: number;
    heldCount?: number;
    finished?: boolean;
  },
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
