// NFT gating helpers: resolve the SIWB-authenticated address from the session
// cookie, then check crawler-free on-chain ownership of a collection.
//
// The address MUST come from the session cookie (never the client), or the gate
// is trivially spoofable: anyone could claim to own the NFT. Ownership is read
// straight from the account's own ledger chain via `fetchNFTsForAddress`, so no
// crawler or index is involved.
//
// Gating by metadata CID alone is weak (anyone can mint a copy pointing at the
// same CID). Pair the CID with an on-chain issuer check so only mints published
// on the official issuer's account chain count.

import { getSession } from './siwb-store';
import { fetchNFTsForAddress, filterNftsByOnChainIssuer, type NormalizedNFT } from './nft';

/** Cookie set by the SIWB verify route (see app/api/auth/verify/route.ts). */
export const SESSION_COOKIE = 'monkeymask_session';

const BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;

export function isValidBananoAddress(address: string): boolean {
  return BANANO_ADDRESS.test(address);
}

/** Read a single cookie value off a Request without extra dependencies. */
function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get('cookie');
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

/**
 * Resolve the address of the current SIWB session, or null when the caller is
 * not signed in / the session expired.
 */
export async function getSessionAddress(request: Request): Promise<string | null> {
  const token = readCookie(request, SESSION_COOKIE);
  const session = await getSession(token);
  return session?.address ?? null;
}

export interface GateRequirements {
  /** Metadata CID shared by all editions in a collection. */
  collection?: string;
  /** Issuer account whose chain must have published the mint block. */
  issuer?: string;
}

export interface OwnershipResult {
  holds: boolean;
  /** Confirmed (non-pending) editions the account holds that satisfy the gate. */
  matched: NormalizedNFT[];
  error?: string;
}

/**
 * Does `address` currently satisfy the gate? Only confirmed, held editions
 * count: pending (sent-but-unclaimed) NFTs don't grant access.
 *
 * - `collection`: require a held edition with this metadata CID.
 * - `issuer`: require the mint block was published on this issuer's chain
 *   (valid `change#supply` → `send#mint`). Use both for a strong gate.
 */
export async function accountHoldsCollection(
  address: string,
  requirements: GateRequirements = {},
): Promise<OwnershipResult> {
  const wantedCid = requirements.collection?.trim();
  const wantedIssuer = requirements.issuer?.trim();

  if (wantedIssuer && !isValidBananoAddress(wantedIssuer)) {
    return { holds: false, matched: [], error: 'Invalid issuer address' };
  }

  const { nfts, error } = await fetchNFTsForAddress(address);
  if (error) return { holds: false, matched: [], error };

  let matched = nfts.filter((nft) => (nft.heldCount ?? 0) > 0 && !nft.pending);
  if (wantedCid) matched = matched.filter((nft) => nft.metadataCid === wantedCid);
  if (wantedIssuer) matched = await filterNftsByOnChainIssuer(matched, wantedIssuer);

  return { holds: matched.length > 0, matched };
}
