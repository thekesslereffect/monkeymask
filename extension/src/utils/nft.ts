// Banano NFT fetching + normalization (extension).
//
// Ownership is derived directly from the account's own ledger chain via
// `scanOwnedNFTs` (see @monkeymask/wallet-standard/nftScan): a bounded set of
// batched RPC calls, no crawler, index, or third-party service required. Any NFT
// minted with the 73-meta-tokens metaprotocol on any site shows up here for both
// the minter and every recipient.

import {
  scanOwnedNFTs,
  type ScanBlock,
  type ScanHistoryEntry,
  type ScannedNFT,
} from '@monkeymask/wallet-standard';

const bananojs = require('@bananocoin/bananojs');

const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const REQUEST_TIMEOUT_MS = 8000;

// Gateways tried (in order) when resolving metadata. A freshly minted NFT is
// pinned to the pinning service and servable there immediately, but public
// gateways like ipfs.io can lag while they discover the CID, which would leave a
// blank tile right after minting. Trying Pinata's gateway first closes that gap.
// Each host also needs a matching entry in the manifest `host_permissions`.
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/',
];

// RPC endpoints for the batched `blocks_info` calls the scanner needs. History
// is read through bananojs (already configured), these power blocks_info.
const RPC_ENDPOINTS = [
  'https://kaliumapi.appditto.com/api',
  'https://booster.dev-ptera.com/banano-rpc',
  'https://api.banano.cc',
];

export interface MonkeyNFT {
  /** Stable unique id (asset representative when available). */
  id: string;
  name: string;
  description?: string;
  /** HTTP(S) URL for the artwork (IPFS URIs are rewritten to a gateway). */
  image?: string;
  collection?: string;
  supplyBlockHash?: string;
  assetRepresentative?: string;
  /** IPFS CID of the metadata JSON, when known. */
  metadataCid?: string;
  /** Max editions: 0 = unlimited, 1 = one-of-a-kind, >1 = limited run. */
  maxSupply?: number;
  /** Editions minted so far in this collection (issuer view). */
  mintedCount?: number;
  /** How many editions of this collection this account still holds. */
  heldCount?: number;
  /** Human label for the supply model. */
  supplyType?: 'unique' | 'limited' | 'unlimited';
  /** Collection supply locked via `#finish_supply`. */
  finished?: boolean;
  /** Sent to you but not yet claimed; the wallet auto-pockets it on next open. */
  pending?: boolean;
}

export interface NFTFetchResult {
  nfts: MonkeyNFT[];
  /** Present when ownership could not be read (e.g. RPC unreachable). */
  error?: string;
}

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

/** Convert an ipfs:// URI or bare CID into an HTTP gateway URL. */
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

function supplyTypeFor(maxSupply: number | undefined): MonkeyNFT['supplyType'] {
  if (maxSupply === undefined) return undefined;
  if (maxSupply === 1) return 'unique';
  if (maxSupply === 0) return 'unlimited';
  return 'limited';
}

// --- Scanner transport -----------------------------------------------------

/** Read a raw account history (oldest first) via bananojs. */
async function accountHistory(address: string): Promise<ScanHistoryEntry[]> {
  const result = await bananojs.getAccountHistory(address, -1, undefined, true);
  const history = Array.isArray(result?.history) ? result.history : [];
  return history as ScanHistoryEntry[];
}

/**
 * Send-block hashes currently receivable (pending) by an account, so NFTs sent
 * to you (or minted to yourself) surface before the wallet claims the pending
 * send. Confirmed-only; best-effort across the RPC endpoints.
 */
async function accountReceivable(address: string): Promise<string[]> {
  const payload = JSON.stringify({
    action: 'receivable',
    account: address,
    count: '100',
    include_only_confirmed: 'true',
  });
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let data: unknown;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } finally {
        clearTimeout(timer);
      }
      const blocks = asRecord(data)?.blocks;
      if (Array.isArray(blocks)) return blocks as string[];
      if (blocks && typeof blocks === 'object') return Object.keys(blocks);
      return []; // node reachable, nothing pending ("" or empty object)
    } catch {
      // Try the next endpoint.
    }
  }
  return [];
}

// Persistent, immutable block cache: confirmed blocks never change, so once a
// hash is resolved we never fetch it again (keeps repeat gallery opens near-zero
// RPC). Capped so storage can't grow without bound.
const BLOCK_CACHE_KEY = 'nftBlockCache';
const BLOCK_CACHE_MAX = 4000;
let blockCache: Record<string, ScanBlock> | null = null;

async function loadBlockCache(): Promise<Record<string, ScanBlock>> {
  if (blockCache) return blockCache;
  try {
    const stored = await chrome.storage.local.get([BLOCK_CACHE_KEY]);
    blockCache = asRecord(stored[BLOCK_CACHE_KEY]) as Record<string, ScanBlock> | null;
  } catch {
    blockCache = null;
  }
  if (!blockCache) blockCache = {};
  return blockCache;
}

async function saveBlockCache(cache: Record<string, ScanBlock>): Promise<void> {
  let entries = Object.entries(cache);
  if (entries.length > BLOCK_CACHE_MAX) {
    entries = entries.slice(entries.length - BLOCK_CACHE_MAX); // drop oldest inserted
  }
  const trimmed = Object.fromEntries(entries);
  blockCache = trimmed;
  try {
    await chrome.storage.local.set({ [BLOCK_CACHE_KEY]: trimmed });
  } catch {
    // Ignore quota errors; in-memory cache still serves this session.
  }
}

async function rpcBlocksInfo(hashes: string[]): Promise<Map<string, ScanBlock>> {
  const payload = JSON.stringify({
    action: 'blocks_info',
    json_block: 'true',
    include_not_found: 'true',
    hashes,
  });
  for (const endpoint of RPC_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let data: unknown;
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        data = await res.json();
      } finally {
        clearTimeout(timer);
      }
      const blocks = asRecord(asRecord(data)?.blocks);
      const out = new Map<string, ScanBlock>();
      if (blocks) {
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
      }
      return out;
    } catch {
      // Try the next endpoint.
    }
  }
  return new Map();
}

/** Cached `blocks_info`: serve known hashes from storage, fetch only the rest. */
async function blocksInfo(hashes: string[]): Promise<Map<string, ScanBlock>> {
  const cache = await loadBlockCache();
  const out = new Map<string, ScanBlock>();
  const missing: string[] = [];
  for (const raw of hashes) {
    const hash = raw.toUpperCase();
    const cached = cache[hash];
    if (cached) out.set(hash, cached);
    else missing.push(hash);
  }
  if (missing.length > 0) {
    const fetched = await rpcBlocksInfo(missing);
    let dirty = false;
    for (const [hash, block] of fetched) {
      out.set(hash, block);
      cache[hash] = block;
      dirty = true;
    }
    if (dirty) await saveBlockCache(cache);
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
// freshly minted CID: an early miss (before the CID propagates to a gateway)
// would be remembered and every later view would keep showing a blank tile.
const metadataCache = new Map<string, ResolvedMetadata>();

async function resolveMetadata(cid: string | undefined): Promise<ResolvedMetadata> {
  if (!cid) return { meta: null, gateway: IPFS_GATEWAY };
  const cached = metadataCache.get(cid);
  if (cached) return cached;

  const path = cid.trim().startsWith('ipfs://') ? cid.trim().slice('ipfs://'.length) : cid.trim();
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const meta = asRecord(await fetchJson(`${gateway}${path}`, 6000));
      if (meta) {
        const resolved: ResolvedMetadata = { meta, gateway };
        metadataCache.set(cid, resolved);
        return resolved;
      }
    } catch {
      // Try the next gateway.
    }
  }
  return { meta: null, gateway: IPFS_GATEWAY }; // not cached: retried next view
}

async function toMonkeyNFT(asset: ScannedNFT): Promise<MonkeyNFT> {
  const { meta: metadata, gateway } = await resolveMetadata(asset.metadataCid);
  return {
    id: asset.assetRep,
    name: pickString(metadata, 'name', 'title') || `NFT ${asset.assetRep.slice(0, 6)}`,
    description: pickString(metadata, 'description'),
    image: ipfsToHttp(pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url'), gateway),
    collection: asset.source === 'minted' ? 'Minted by you' : pickString(metadata, 'collection'),
    supplyBlockHash: asset.supplyBlockHash,
    assetRepresentative: asset.assetRep,
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
 */
export async function fetchAllNFTsForAddress(address: string): Promise<NFTFetchResult> {
  if (!address) return { nfts: [], error: 'No address provided' };

  let scanned: ScannedNFT[];
  try {
    scanned = await scanOwnedNFTs(address, { accountHistory, blocksInfo, accountReceivable });
  } catch (error) {
    return { nfts: [], error: error instanceof Error ? error.message : 'Failed to load NFTs' };
  }

  const nfts = await Promise.all(scanned.map(toMonkeyNFT));
  return { nfts };
}
