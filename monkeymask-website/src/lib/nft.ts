// Banano NFT fetching + normalization (website, server-side).
//
// Ownership is derived directly from an account's own ledger chain via
// `scanOwnedNFTs` (see @monkeymask/wallet-standard/nftScan): a bounded set of
// batched RPC calls, no crawler and no third-party indexer required. Any NFT
// minted with the 73-meta-tokens metaprotocol on any site shows up here for both
// the minter and every recipient, with no crawler, index, or backend involved.

import {
  isSupplyRepresentative,
  isValidMetadataRepresentative,
  scanOwnedNFTs,
  type ScanBlock,
  type ScanHistoryEntry,
  type ScannedNFT,
} from '@monkeymask/wallet-standard';

/** One ERC-721/OpenSea-style trait (client-side display only). */
export interface NftAttribute {
  trait_type?: string;
  value: string | number;
  /** OpenSea display hint: 'number' | 'boost_number' | 'boost_percentage' | 'date'. */
  display_type?: string;
}

/** Rendering category derived from an attribute's `display_type`. */
export type AttributeKind = 'boost' | 'date' | 'number' | 'text';

/**
 * Turn a raw attribute into a display-ready `{ label, value, kind }` following
 * OpenSea's `display_type` semantics so views can render each kind as intended.
 */
export function attributeDisplay(attr: NftAttribute): { label: string; value: string; kind: AttributeKind } {
  const label = attr.trait_type ?? 'Trait';
  switch (attr.display_type) {
    case 'date': {
      const ts = typeof attr.value === 'number' ? attr.value : Number(attr.value);
      if (Number.isFinite(ts)) {
        // OpenSea uses unix seconds; tolerate millisecond timestamps too.
        const date = new Date(ts < 1e12 ? ts * 1000 : ts);
        if (!Number.isNaN(date.getTime())) {
          return { label, value: date.toLocaleDateString(), kind: 'date' };
        }
      }
      return { label, value: String(attr.value), kind: 'date' };
    }
    case 'boost_percentage': {
      const n = Number(attr.value);
      const value = Number.isFinite(n) ? `${n > 0 ? '+' : ''}${n}%` : `${attr.value}%`;
      return { label, value, kind: 'boost' };
    }
    case 'boost_number': {
      const n = Number(attr.value);
      const value = Number.isFinite(n) && n > 0 ? `+${n}` : String(attr.value);
      return { label, value, kind: 'boost' };
    }
    case 'number':
      return { label, value: String(attr.value), kind: 'number' };
    default:
      return { label, value: String(attr.value), kind: 'text' };
  }
}

export interface NormalizedNFT {
  id: string;
  name: string;
  description?: string;
  image?: string;
  collection?: string;
  /** ERC-721 attributes from the metadata JSON, when present. */
  attributes?: NftAttribute[];
  /** MIME type of the artwork (from `properties.content_type`/`files`), if known. */
  contentType?: string;
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
  /** True once the collection is locked (`#finish_supply`): no more editions. */
  finished?: boolean;
  /** Sent to you but not yet claimed; the wallet auto-pockets it on next open. */
  pending?: boolean;
}

export interface NFTFetchResult {
  nfts: NormalizedNFT[];
  error?: string;
}

const RPC_URL = process.env.BANANO_RPC_URL ?? 'https://kaliumapi.appditto.com/api';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/';
const REQUEST_TIMEOUT_MS = 8000;

// Gateways tried (in order) when resolving metadata. Freshly minted NFTs are
// pinned to the pinning service and are servable there immediately, but public
// gateways like ipfs.io can lag by seconds to minutes while they discover the
// CID. Including Pinata's gateway avoids a "blank tile until it propagates"
// window right after minting. Set PINATA_GATEWAY to prefer a dedicated gateway.
const IPFS_GATEWAYS: string[] = Array.from(
  new Set(
    [
      IPFS_GATEWAY,
      process.env.PINATA_GATEWAY,
      'https://gateway.pinata.cloud/ipfs/',
      'https://dweb.link/ipfs/',
      'https://ipfs.io/ipfs/',
    ].filter((g): g is string => Boolean(g)),
  ),
);

async function fetchJson(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function ipfsToHttp(value: string | undefined, gateway: string = IPFS_GATEWAY): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('ipfs://')) return `${gateway}${trimmed.slice('ipfs://'.length)}`;
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[0-9a-z]+)(\/.*)?$/.test(trimmed)) {
    return `${gateway}${trimmed}`;
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

function supplyTypeFor(maxSupply: number | undefined): NormalizedNFT['supplyType'] {
  if (maxSupply === undefined) return undefined;
  if (maxSupply === 1) return 'unique';
  if (maxSupply === 0) return 'unlimited';
  return 'limited';
}

/** Pull ERC-721 `attributes` out of a metadata object, sanitizing each entry. */
function normalizeAttributes(metadata: Record<string, unknown> | null): NftAttribute[] | undefined {
  const raw = metadata?.attributes;
  if (!Array.isArray(raw)) return undefined;
  const out: NftAttribute[] = [];
  for (const item of raw) {
    const rec = asRecord(item);
    if (!rec) continue;
    const value = rec.value;
    if (typeof value !== 'string' && typeof value !== 'number') continue;
    if (typeof value === 'string' && value.trim() === '') continue;
    const attr: NftAttribute = { value };
    if (typeof rec.trait_type === 'string' && rec.trait_type.trim()) attr.trait_type = rec.trait_type.trim();
    if (typeof rec.display_type === 'string' && rec.display_type.trim()) attr.display_type = rec.display_type.trim();
    out.push(attr);
  }
  return out.length > 0 ? out : undefined;
}

/** Best-effort artwork MIME from `properties.content_type` or `properties.files`. */
function contentTypeFrom(metadata: Record<string, unknown> | null): string | undefined {
  const props = asRecord(metadata?.properties);
  const direct = pickString(props, 'content_type', 'contentType', 'mime', 'mimeType');
  if (direct) return direct;
  const files = props?.files;
  if (Array.isArray(files)) {
    for (const file of files) {
      const type = pickString(asRecord(file), 'type', 'content_type', 'mimeType');
      if (type) return type;
    }
  }
  return undefined;
}

// --- Scanner transport -----------------------------------------------------

async function rpc(action: string, params: Record<string, unknown>): Promise<unknown> {
  return fetchJson(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
}

async function accountHistory(address: string): Promise<ScanHistoryEntry[]> {
  const payload = (await rpc('account_history', { account: address, count: -1, raw: true })) as {
    history?: ScanHistoryEntry[];
    error?: string;
  };
  if (payload.error) throw new Error(payload.error);
  return Array.isArray(payload.history) ? payload.history : [];
}

/**
 * Send-block hashes currently receivable (pending) by an account. Lets NFTs sent
 * to you (or minted to yourself) show up before the wallet claims the pending
 * send. Confirmed-only so we never surface un-cemented blocks.
 */
async function accountReceivable(address: string): Promise<string[]> {
  const payload = (await rpc('receivable', {
    account: address,
    count: '100',
    include_only_confirmed: true,
  })) as { blocks?: string[] | Record<string, unknown> | ''; error?: string };
  if (payload.error) throw new Error(payload.error);
  const blocks = payload.blocks;
  if (Array.isArray(blocks)) return blocks;
  if (blocks && typeof blocks === 'object') return Object.keys(blocks);
  return [];
}

// Immutable per-process block cache: confirmed blocks never change.
const blockCache = new Map<string, ScanBlock>();

async function rpcBlocksInfo(hashes: string[]): Promise<Map<string, ScanBlock>> {
  const out = new Map<string, ScanBlock>();
  let data: unknown;
  try {
    data = await rpc('blocks_info', { json_block: true, include_not_found: true, hashes });
  } catch {
    return out;
  }
  const blocks = asRecord(asRecord(data)?.blocks);
  if (!blocks) return out;
  for (const [hash, raw] of Object.entries(blocks)) {
    const rec = asRecord(raw);
    const contents = asRecord(rec?.contents);
    out.set(hash.toUpperCase(), {
      subtype: pickString(rec, 'subtype'),
      representative: pickString(contents, 'representative'),
      link: pickString(contents, 'link'),
      previous: pickString(contents, 'previous'),
      height: pickString(rec, 'height'),
      blockAccount: pickString(rec, 'block_account'),
    });
  }
  return out;
}

async function blocksInfo(hashes: string[]): Promise<Map<string, ScanBlock>> {
  const out = new Map<string, ScanBlock>();
  const missing: string[] = [];
  for (const raw of hashes) {
    const hash = raw.toUpperCase();
    const cached = blockCache.get(hash);
    if (cached) out.set(hash, cached);
    else missing.push(hash);
  }
  if (missing.length > 0) {
    const fetched = await rpcBlocksInfo(missing);
    for (const [hash, block] of fetched) {
      out.set(hash, block);
      blockCache.set(hash, block);
    }
  }
  return out;
}

// --- Metadata resolution ---------------------------------------------------

interface ResolvedMetadata {
  meta: Record<string, unknown> | null;
  /** Gateway that actually served the JSON (reused for the image URL). */
  gateway: string;
}

// Only successful resolutions are cached. Caching failures would "poison" a
// freshly minted CID: the first request (before the CID propagates to a public
// gateway) would fail and every later request would keep returning the cached
// null, leaving a permanently blank tile until the process restarted.
const metadataCache = new Map<string, ResolvedMetadata>();

async function resolveMetadata(cid: string | undefined): Promise<ResolvedMetadata> {
  if (!cid) return { meta: null, gateway: IPFS_GATEWAY };
  const cached = metadataCache.get(cid);
  if (cached) return cached;

  const path = cid.trim().startsWith('ipfs://') ? cid.trim().slice('ipfs://'.length) : cid.trim();
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const meta = asRecord(
        await fetchJson(`${gateway}${path}`, { headers: { Accept: 'application/json' } }, 6000),
      );
      if (meta) {
        const resolved: ResolvedMetadata = { meta, gateway };
        metadataCache.set(cid, resolved);
        return resolved;
      }
    } catch {
      // Try the next gateway.
    }
  }
  return { meta: null, gateway: IPFS_GATEWAY }; // not cached: retried next request
}

async function toNormalizedNFT(asset: ScannedNFT): Promise<NormalizedNFT> {
  const { meta: metadata, gateway } = await resolveMetadata(asset.metadataCid);
  return {
    id: asset.assetRep,
    name: pickString(metadata, 'name', 'title') || `NFT ${asset.assetRep.slice(0, 6)}`,
    description: pickString(metadata, 'description'),
    image: ipfsToHttp(pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url'), gateway),
    collection: asset.source === 'minted' ? 'Minted by you' : pickString(metadata, 'collection'),
    attributes: normalizeAttributes(metadata),
    contentType: contentTypeFrom(metadata),
    assetRepresentative: asset.assetRep,
    supplyBlockHash: asset.supplyBlockHash,
    metadataCid: asset.metadataCid,
    maxSupply: asset.maxSupply,
    mintedCount: asset.mintedCount ?? asset.heldCount,
    heldCount: asset.heldCount,
    supplyType: supplyTypeFor(asset.maxSupply),
    finished: asset.finished,
    pending: asset.pending,
  };
}

/**
 * Fetch every NFT currently owned by `address`, derived from its own ledger
 * chain. Universal (works for mints created on any site) and crawler-free.
 * Never throws; RPC failures return `{ nfts: [], error }`.
 */
export async function fetchNFTsForAddress(address: string): Promise<NFTFetchResult> {
  if (!address) return { nfts: [], error: 'No address provided' };
  let scanned: ScannedNFT[];
  try {
    scanned = await scanOwnedNFTs(address, { accountHistory, blocksInfo, accountReceivable });
  } catch (error) {
    return { nfts: [], error: error instanceof Error ? error.message : 'Failed to load NFTs' };
  }
  const nfts = await Promise.all(scanned.map(toNormalizedNFT));
  return { nfts };
}

const MINT_HASH = /^[0-9A-F]{64}$/;

/**
 * Keep only NFTs whose asset representative (mint block hash) was published on
 * `issuerAddress`'s chain as a valid `change#supply` → `send#mint` pair.
 *
 * This closes the "mint a copy with the same metadata CID" bypass: a forger's
 * mint block lives on their account, not the official issuer's.
 */
export async function filterNftsByOnChainIssuer(
  nfts: NormalizedNFT[],
  issuerAddress: string,
): Promise<NormalizedNFT[]> {
  if (nfts.length === 0) return [];

  const assetReps = [
    ...new Set(
      nfts
        .map((nft) => nft.assetRepresentative?.toUpperCase())
        .filter((hash): hash is string => !!hash && MINT_HASH.test(hash)),
    ),
  ];
  if (assetReps.length === 0) return [];

  const mintBlocks = await blocksInfo(assetReps);
  const supplyHashes = new Set<string>();
  for (const rep of assetReps) {
    const prev = mintBlocks.get(rep)?.previous?.toUpperCase();
    if (prev && MINT_HASH.test(prev)) supplyHashes.add(prev);
  }
  const supplyBlocks =
    supplyHashes.size > 0 ? await blocksInfo([...supplyHashes]) : new Map<string, ScanBlock>();

  return nfts.filter((nft) => {
    const rep = nft.assetRepresentative?.toUpperCase();
    if (!rep) return false;

    const mint = mintBlocks.get(rep);
    if (!mint || mint.subtype !== 'send') return false;
    if (mint.blockAccount !== issuerAddress) return false;
    if (!mint.representative || !isValidMetadataRepresentative(mint.representative)) return false;

    const prev = mint.previous?.toUpperCase();
    if (!prev) return false;
    const supply = supplyBlocks.get(prev);
    if (!supply || supply.subtype !== 'change') return false;
    if (supply.blockAccount !== issuerAddress) return false;
    if (!supply.representative || !isSupplyRepresentative(supply.representative)) return false;

    return true;
  });
}
