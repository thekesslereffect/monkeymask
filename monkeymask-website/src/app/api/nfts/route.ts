import { NextResponse } from 'next/server';
import { fetchNFTsForAddress } from '@/lib/nft';

const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get('address')?.trim() ?? '';

  if (!BANANO_ADDRESS.test(address)) {
    return NextResponse.json({ nfts: [], error: 'Invalid Banano address' }, { status: 400 });
  }

  // Ownership is derived crawler-free from the account's own ledger chain, so
  // NFTs minted on any site appear for the minter and every recipient. No index,
  // no backend required.
  const owned = await fetchNFTsForAddress(address);

  const error = owned.nfts.length === 0 ? owned.error : undefined;
  const headers = error ? undefined : { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' };
  return NextResponse.json({ nfts: owned.nfts, error }, { headers });
}
