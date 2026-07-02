// Banano NFT fetching + normalization (server side).
//
// Banano NFTs use the "73-meta-tokens" metaprotocol: an NFT is an asset
// representative (a ban_ address) whose metadata JSON lives on IPFS. bananojs
// does not cover this, so we query a community caching node that lists the NFTs
// owned by an account, then resolve the IPFS metadata and normalize everything
// into a stable shape for the client. All fetching happens on the server to
// avoid CORS and to keep the upstream endpoint swappable via env.

export interface NormalizedNFT {
  id: string;
  name: string;
  description?: string;
  image?: string;
  collection?: string;
  assetRepresentative?: string;
  supplyBlockHash?: string;
  metadataCid?: string;
  /** Max editions: 0 = unlimited, 1 = one-of-a-kind, >1 = limited run. */
  maxSupply?: number;
  /** Editions minted so far in this collection (issuer view). */
  mintedCount?: number;
  /** How many editions of this collection this account still holds. */
  heldCount?: number;
  /** Human label for the supply model. */
  supplyType?: 'unique' | 'limited' | 'unlimited';
}

export interface NFTFetchResult {
  nfts: NormalizedNFT[];
  error?: string;
}

const NFT_API_BASE = process.env.BANANO_NFT_API ?? 'https://cwispy.app/nft_api';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/';
const REQUEST_TIMEOUT_MS = 8000;

async function fetchJson(url: string, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function ipfsToHttp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('ipfs://')) return `${IPFS_GATEWAY}${trimmed.slice('ipfs://'.length)}`;
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[0-9a-z]+)(\/.*)?$/.test(trimmed)) {
    return `${IPFS_GATEWAY}${trimmed}`;
  }
  return trimmed;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function pickString(record: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return undefined;
}

function extractList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
  }
  const record = asRecord(payload);
  if (!record) return [];
  for (const key of ['nfts', 'assets', 'data', 'results']) {
    const val = record[key];
    if (Array.isArray(val)) {
      return val.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
    }
  }
  return [];
}

async function normalizeItem(item: Record<string, unknown>, index: number): Promise<NormalizedNFT> {
  const assetRepresentative = pickString(item, 'asset_representative', 'mint_representative', 'nft', 'representative');
  const supplyBlockHash = pickString(item, 'supply_block_hash', 'supply_block', 'supplyBlockHash');
  const id = assetRepresentative || pickString(item, 'id', 'hash') || `nft-${index}`;

  let metadata = asRecord(item.metadata);
  let metadataCid = pickString(item, 'ipfs_cid', 'metadata_ipfs', 'metadata_cid');
  if (!metadata) {
    const cid = metadataCid ?? pickString(item, 'metadata_representative');
    const metaUrl = ipfsToHttp(cid);
    if (metaUrl) {
      metadataCid = cid;
      try {
        metadata = asRecord(await fetchJson(metaUrl));
      } catch {
        metadata = null;
      }
    }
  }

  const name =
    pickString(metadata, 'name', 'title') ||
    pickString(item, 'name', 'title') ||
    (assetRepresentative ? `NFT ${assetRepresentative.slice(4, 10)}` : `NFT #${index + 1}`);

  const image = ipfsToHttp(
    pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url') || pickString(item, 'image'),
  );

  const description = pickString(metadata, 'description') || pickString(item, 'description');
  const collection = pickString(metadata, 'collection') || pickString(item, 'collection', 'issuer');

  return { id, name, description, image, collection, assetRepresentative, supplyBlockHash, metadataCid };
}

/** Fetch and normalize NFTs owned by an address. Never throws. */
export async function fetchNFTsForAddress(address: string): Promise<NFTFetchResult> {
  if (!address) return { nfts: [], error: 'No address provided' };
  try {
    const payload = await fetchJson(`${NFT_API_BASE}/owner/${address}/nfts`);
    const list = extractList(payload);
    const nfts = await Promise.all(list.map((item, index) => normalizeItem(item, index)));
    return { nfts };
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? 'NFT service timed out'
        : error instanceof Error
          ? error.message
          : 'Failed to load NFTs';
    return { nfts: [], error: message };
  }
}
