import { NextResponse } from 'next/server';
import { fetchNFTsForAddress, type NormalizedNFT } from '@/lib/nft';
import { fetchMintedNFTs } from '@/lib/mintedNfts';
import { convexEnabled, convexGet } from '@/lib/convexClient';

const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

function mergeByAsset(...lists: NormalizedNFT[][]): NormalizedNFT[] {
  // Collections are grouped by their shared metadata CID (every edition of a
  // collection reuses one CID). When multiple sources describe the same
  // collection we keep the card reporting the most copies held — whichever of
  // the self-index or the crawler currently has the freshest ownership view
  // wins, so a momentarily-behind source can't pin a stale `heldCount`.
  const byCid = new Map<string, NormalizedNFT>();
  const byAsset = new Map<string, NormalizedNFT>();
  for (const list of lists) {
    for (const nft of list) {
      if (nft.metadataCid) {
        const existing = byCid.get(nft.metadataCid);
        if (!existing || (nft.heldCount ?? 0) > (existing.heldCount ?? 0)) {
          byCid.set(nft.metadataCid, nft);
        }
      } else {
        const key = nft.assetRepresentative ?? nft.id;
        if (!byAsset.has(key)) byAsset.set(key, nft);
      }
    }
  }
  return [...byCid.values(), ...byAsset.values()];
}

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get('address')?.trim() ?? '';

  if (!BANANO_ADDRESS.test(address)) {
    return NextResponse.json({ nfts: [], error: 'Invalid Banano address' }, { status: 400 });
  }

  // Preferred path: the durable Convex index (centralized crawler across all
  // issuers). Self-crawl still runs so a viewer's own fresh mints appear
  // instantly even before the crawler catches up. Both are best-effort.
  if (convexEnabled()) {
    try {
      const [convex, minted] = await Promise.all([
        convexGet<{ nfts: NormalizedNFT[] }>(`/nfts?address=${address}`),
        fetchMintedNFTs(address),
      ]);
      // Prefer the self-indexed cards for the viewer's own collections (they
      // reflect the freshest on-chain state); the convex index also now reports
      // the supply model + minted/held counts, so a count shows either way.
      const nfts = mergeByAsset(minted, convex.nfts ?? []);
      return NextResponse.json({ nfts });
    } catch {
      // Fall through to the legacy path if the index is unreachable.
    }
  }

  // Fallback: self-indexed mints (reliable) + community indexer (best-effort).
  const [minted, owned] = await Promise.all([
    fetchMintedNFTs(address),
    fetchNFTsForAddress(address),
  ]);

  const nfts = mergeByAsset(minted, owned.nfts);
  const error = nfts.length === 0 ? owned.error : undefined;
  const headers = error ? undefined : { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' };
  return NextResponse.json({ nfts, error }, { headers });
}
