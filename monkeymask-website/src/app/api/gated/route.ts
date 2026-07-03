import { NextResponse } from 'next/server';
import { accountHoldsCollection, getSessionAddress, isValidBananoAddress } from '@/lib/gating';

// Session-scoped and never cached: the response depends on who is signed in.
export const dynamic = 'force-dynamic';

/**
 * The members-only payload revealed to holders. In a real app this would be
 * premium content, a download link, an API token, a Discord invite, etc.
 */
function memberContent(address: string) {
  return {
    secret: 'Welcome, holder. This content is gated behind on-chain NFT ownership.',
    perk: 'https://github.com/BananoCoin',
    unlockedFor: address,
    unlockedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request) {
  const address = await getSessionAddress(request);
  if (!address) {
    return NextResponse.json(
      { unlocked: false, reason: 'not_signed_in', error: 'Sign in with Banano first' },
      { status: 401 },
    );
  }

  const params = new URL(request.url).searchParams;
  const collection = params.get('collection')?.trim() || undefined;
  const issuer = params.get('issuer')?.trim() || undefined;

  if (issuer && !isValidBananoAddress(issuer)) {
    return NextResponse.json(
      { unlocked: false, reason: 'invalid_issuer', error: 'Invalid issuer address' },
      { status: 400 },
    );
  }

  const { holds, matched, error } = await accountHoldsCollection(address, { collection, issuer });

  if (error) {
    return NextResponse.json({ unlocked: false, reason: 'scan_failed', error }, { status: 502 });
  }
  if (!holds) {
    return NextResponse.json(
      {
        unlocked: false,
        reason: 'no_nft',
        address,
        requiredCollection: collection ?? null,
        requiredIssuer: issuer ?? null,
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    unlocked: true,
    address,
    requiredCollection: collection ?? null,
    requiredIssuer: issuer ?? null,
    matched: matched.map((nft) => ({
      name: nft.name,
      image: nft.image,
      metadataCid: nft.metadataCid,
      assetRepresentative: nft.assetRepresentative,
      heldCount: nft.heldCount,
    })),
    content: memberContent(address),
  });
}
