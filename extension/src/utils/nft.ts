// Banano NFT fetching + normalization.
//
// Banano NFTs follow the "73-meta-tokens" / banano-metanode metaprotocol: an NFT
// is identified by an asset representative (a ban_ address) and its metadata JSON
// lives on IPFS. Community caching nodes (e.g. banano-nft-node) expose a REST
// endpoint that lists the NFTs currently owned by an account. bananojs does not
// implement any of this, so we talk to the caching API directly and resolve the
// IPFS metadata ourselves, normalizing everything into a stable shape for the UI.

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
}

export interface NFTFetchResult {
  nfts: MonkeyNFT[];
  /** Present when the upstream API could not be reached or returned an error. */
  error?: string;
}

import {
  accountToPublicKeyHex,
  isSupplyRepresentative,
  isValidMetadataRepresentative,
  maxSupplyFromRepresentative,
  metadataCidFromRepresentative,
  representativeMatchesAsset,
} from '@monkeymask/wallet-standard';

const bananojs = require('@bananocoin/bananojs');

// Configurable so we can point at a self-hosted mirror without a code change.
const NFT_API_BASE = 'https://cwispy.app/nft_api';
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const REQUEST_TIMEOUT_MS = 8000;

// Optional MonkeyMask Convex NFT index (injected at build time, overridable in
// chrome.storage). When set, it replaces the flaky community indexer for NFTs
// received from others (e.g. on secondary accounts).
const BUILD_CONVEX_URL = (process.env.MONKEYMASK_CONVEX_URL || '').replace(/\/$/, '');

let resolvedConvexUrl: string | undefined;

/** Resolve the Convex HTTP-actions base URL (build-time env or storage override). */
async function resolveConvexSiteUrl(): Promise<string> {
  if (resolvedConvexUrl !== undefined) return resolvedConvexUrl;
  try {
    const stored = await chrome.storage.local.get(['convexSiteUrl']);
    const fromStorage =
      typeof stored.convexSiteUrl === 'string' ? stored.convexSiteUrl.trim().replace(/\/$/, '') : '';
    if (fromStorage) {
      resolvedConvexUrl = fromStorage;
      return resolvedConvexUrl;
    }
  } catch {
    // Non-extension contexts (tests) fall through to the build-time URL.
  }
  resolvedConvexUrl = BUILD_CONVEX_URL;
  return resolvedConvexUrl;
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
export function ipfsToHttp(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('ipfs://')) return `${IPFS_GATEWAY}${trimmed.slice('ipfs://'.length)}`;
  // Bare CID (v0 "Qm..." or v1 "bafy...").
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

/** Pull the list of NFT records out of whatever shape the API returned. */
function extractList(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.map(asRecord).filter((r): r is Record<string, unknown> => r !== null);
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

async function normalizeItem(item: Record<string, unknown>, index: number): Promise<MonkeyNFT> {
  const assetRepresentative = pickString(item, 'asset_representative', 'mint_representative', 'nft', 'representative');
  const supplyBlockHash = pickString(item, 'supply_block_hash', 'supply_block', 'supplyBlockHash');
  const id = assetRepresentative || pickString(item, 'id', 'hash') || `nft-${index}`;

  // Metadata may be embedded, or referenced by an IPFS CID we must resolve.
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

  return { id, name, description, image, collection, supplyBlockHash, assetRepresentative, metadataCid };
}

/**
 * Fetch and normalize the NFTs owned by a Banano address. Never throws — upstream
 * failures are returned as `{ nfts: [], error }` so the UI can degrade gracefully.
 */
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

interface RawHistoryEntry {
  hash: string;
  height: string;
  subtype?: string;
  representative?: string;
  link?: string;
}

/** One edition (mint block) belonging to a collection. */
interface EditionBlock {
  hash: string;
  held: boolean;
}

/**
 * Enumerate every edition of a collection on the issuer's chain.
 *
 * An edition is a self-delimiting `change#supply` → `send#mint` pair: a supply
 * block immediately followed by a send that reuses the collection's metadata
 * representative. Counting whole pairs (never bare sends) is what prevents
 * ordinary payments — which keep the account's representative — from ever being
 * miscounted as phantom editions. An edition is still *held* if the mint sent it
 * to this account and it was not later transferred away (a `send#asset`).
 */
function collectEditions(
  history: RawHistoryEntry[],
  metadataRep: string,
  maxSupply: number,
  ownerPublicKey: string,
): EditionBlock[] {
  const byHeight = new Map<number, RawHistoryEntry>();
  for (const b of history) byHeight.set(Number(b.height), b);

  const editions: EditionBlock[] = [];
  for (const entry of history) {
    if (entry.subtype !== 'change' || !entry.representative) continue;
    if (!isSupplyRepresentative(entry.representative)) continue;

    const mint = byHeight.get(Number(entry.height) + 1);
    if (!mint || mint.subtype !== 'send') continue;
    if (mint.representative !== metadataRep) continue;

    const heldByOwner = (mint.link ?? '').toUpperCase() === ownerPublicKey;
    const transferredAway = history.some(
      (t) =>
        t.subtype === 'send' &&
        !!t.representative &&
        representativeMatchesAsset(t.representative, mint.hash),
    );
    editions.push({ hash: mint.hash, held: heldByOwner && !transferredAway });

    // The metaprotocol stops minting once the supply is exhausted.
    if (maxSupply > 0 && editions.length >= maxSupply) break;
  }
  return editions;
}

/**
 * List collections minted by an account by crawling only that account's own
 * history — no third-party indexer. Finds each `change#supply` block, reads the
 * following `#mint` block for the metadata CID, then enumerates every edition to
 * report the supply model and how many copies the account still holds. Returns
 * one card per collection (deduped by metadata CID).
 */
export async function fetchMintedNFTsForAddress(address: string): Promise<MonkeyNFT[]> {
  let history: RawHistoryEntry[];
  try {
    const result = await bananojs.getAccountHistory(address, -1, undefined, true);
    history = Array.isArray(result?.history) ? (result.history as RawHistoryEntry[]) : [];
  } catch {
    return [];
  }
  history.sort((a, b) => Number(a.height) - Number(b.height));

  let ownerPublicKey: string;
  try {
    ownerPublicKey = accountToPublicKeyHex(address);
  } catch {
    return [];
  }

  const byHeight = new Map<number, RawHistoryEntry>();
  for (const entry of history) byHeight.set(Number(entry.height), entry);

  const nfts: MonkeyNFT[] = [];
  const seenCids = new Set<string>();
  for (const entry of history) {
    if (entry.subtype !== 'change') continue;
    if (!entry.representative || !isSupplyRepresentative(entry.representative)) continue;

    const supplyHeight = Number(entry.height);
    const mint = byHeight.get(supplyHeight + 1);
    if (!mint || !mint.representative) continue;
    if (!isValidMetadataRepresentative(mint.representative)) continue;

    let cid: string;
    try {
      cid = metadataCidFromRepresentative(mint.representative);
    } catch {
      continue;
    }
    if (seenCids.has(cid)) continue;
    seenCids.add(cid);

    const maxSupply = maxSupplyFromRepresentative(entry.representative);
    const editions = collectEditions(history, mint.representative, maxSupply, ownerPublicKey);
    if (editions.length === 0) continue;

    const heldCount = editions.filter((e) => e.held).length;
    // Ownership gallery: skip collections where every edition was transferred
    // away. You minted them, but you no longer hold any copy.
    if (heldCount === 0) continue;
    // Prefer a held edition as the actionable asset (transfer targets it).
    const primary = editions.find((e) => e.held) ?? editions[0];
    const supplyType: MonkeyNFT['supplyType'] =
      maxSupply === 1 ? 'unique' : maxSupply === 0 ? 'unlimited' : 'limited';

    let metadata: Record<string, unknown> | null = null;
    const metaUrl = ipfsToHttp(cid);
    if (metaUrl) {
      try {
        metadata = asRecord(await fetchJson(metaUrl));
      } catch {
        metadata = null;
      }
    }

    nfts.push({
      id: primary.hash,
      name: pickString(metadata, 'name', 'title') || `NFT ${primary.hash.slice(0, 6)}`,
      description: pickString(metadata, 'description'),
      image: ipfsToHttp(pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url')),
      collection: 'Minted by you',
      supplyBlockHash: entry.hash,
      assetRepresentative: primary.hash,
      metadataCid: cid,
      maxSupply,
      mintedCount: editions.length,
      heldCount,
      supplyType,
    });
  }
  return nfts;
}

/** Fetch owned NFTs from the MonkeyMask Convex index. Never throws. */
async function fetchConvexNFTs(address: string, siteUrl: string): Promise<NFTFetchResult> {
  if (!siteUrl) return { nfts: [], error: 'Convex index not configured' };
  try {
    const payload = (await fetchJson(`${siteUrl}/nfts?address=${encodeURIComponent(address)}`)) as {
      nfts?: MonkeyNFT[];
      error?: string;
    };
    return { nfts: Array.isArray(payload.nfts) ? payload.nfts : [], error: payload.error };
  } catch (error) {
    return { nfts: [], error: error instanceof Error ? error.message : 'Convex index unavailable' };
  }
}

/**
 * Merge NFT lists by metadata CID (collections) or asset rep (singletons).
 * Mirrors the website `/api/nfts` merge so secondary accounts get the same
 * held counts whether the card came from self-crawl or the Convex index.
 */
function mergeByAsset(minted: MonkeyNFT[], ...lists: MonkeyNFT[][]): MonkeyNFT[] {
  const byCid = new Map<string, MonkeyNFT>();
  const byAsset = new Map<string, MonkeyNFT>();
  const finishedCids = new Set<string>();
  for (const list of [minted, ...lists]) {
    for (const nft of list) {
      if (nft.metadataCid) {
        if (nft.finished) finishedCids.add(nft.metadataCid);
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
  for (const [cid, nft] of byCid) {
    if (finishedCids.has(cid)) nft.finished = true;
  }
  return [...byCid.values(), ...byAsset.values()];
}

/**
 * Merge reliable self-indexed mints with an "owned" list. Prefers the MonkeyMask
 * Convex index when configured, falling back to the community indexer otherwise.
 */
export async function fetchAllNFTsForAddress(address: string): Promise<NFTFetchResult> {
  if (!address) return { nfts: [], error: 'No address provided' };
  const convexUrl = await resolveConvexSiteUrl();
  const minted = await fetchMintedNFTsForAddress(address);

  let owned: NFTFetchResult;
  if (convexUrl) {
    owned = await fetchConvexNFTs(address, convexUrl);
    // Received NFTs on secondary accounts live in the index; if both sources are
    // empty, still try the community indexer as a last resort.
    if (owned.nfts.length === 0 && minted.length === 0) {
      owned = await fetchNFTsForAddress(address);
    }
  } else {
    owned = await fetchNFTsForAddress(address);
  }

  const nfts = mergeByAsset(minted, owned.nfts);
  return { nfts, error: nfts.length === 0 ? owned.error : undefined };
}
