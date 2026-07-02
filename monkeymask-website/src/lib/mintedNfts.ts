// Self-contained "NFTs minted by this account" indexer.
//
// Unlike listing every NFT an account *owns* (which requires a global index of
// all mints + full chain-of-custody tracing), listing what an account *minted*
// only needs that one account's own history: find each `change#supply` block,
// read the following `#mint` block, decode its metadata CID, and resolve the
// JSON. No third-party indexer required.

import {
  accountToPublicKeyHex,
  isSupplyRepresentative,
  isValidMetadataRepresentative,
  isFinishSupplyRepresentative,
  finishSupplyHeightFromRepresentative,
  maxSupplyFromRepresentative,
  metadataCidFromRepresentative,
  representativeMatchesAsset,
} from '@monkeymask/wallet-standard';
import { ipfsToHttp, type NormalizedNFT } from './nft';

const RPC_URL = process.env.BANANO_RPC_URL ?? 'https://kaliumapi.appditto.com/api';
const REQUEST_TIMEOUT_MS = 8000;

interface RawHistoryEntry {
  hash: string;
  height: string;
  subtype?: string;
  representative?: string;
  link?: string;
}

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

async function getAccountHistory(address: string): Promise<RawHistoryEntry[]> {
  const payload = (await fetchJson(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // count/raw must be a number/boolean — Kalium rejects string values.
    body: JSON.stringify({ action: 'account_history', account: address, count: -1, raw: true }),
  })) as { history?: RawHistoryEntry[]; error?: string };
  if (payload.error) throw new Error(payload.error);
  const history = Array.isArray(payload.history) ? payload.history : [];
  return history.sort((a, b) => Number(a.height) - Number(b.height));
}

async function resolveMetadata(cid: string): Promise<Record<string, unknown> | null> {
  const url = ipfsToHttp(cid);
  if (!url) return null;
  try {
    const json = await fetchJson(url, { headers: { Accept: 'application/json' } });
    return json && typeof json === 'object' ? (json as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function pickString(record: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return undefined;
}

/** One edition (mint block) belonging to a collection. */
interface EditionBlock {
  hash: string;
  held: boolean;
}

/**
 * Enumerate every edition of a collection on the issuer's chain.
 *
 * An edition is a self-delimiting `change#supply` → `send#mint` pair (the mint
 * reuses the collection's metadata rep). Counting whole pairs — never bare sends
 * — is what stops ordinary payments (which keep the account's representative)
 * from being miscounted as phantom editions. An edition is still held if the
 * mint sent it to this account and it was not later transferred away.
 */
function collectEditions(
  history: RawHistoryEntry[],
  metadataRep: string,
  maxSupply: number,
  ownerPublicKey: string,
): { editions: EditionBlock[]; supplyHeights: number[] } {
  const byHeight = new Map<number, RawHistoryEntry>();
  for (const b of history) byHeight.set(Number(b.height), b);

  const editions: EditionBlock[] = [];
  const supplyHeights: number[] = [];
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
    supplyHeights.push(Number(entry.height));
    if (maxSupply > 0 && editions.length >= maxSupply) break;
  }
  return { editions, supplyHeights };
}

/**
 * List collections minted by (and the copies still held by) `address`. Never
 * throws; returns an empty list on RPC failure so callers can merge it with
 * other sources. One card per collection, with supply model + held count.
 */
export async function fetchMintedNFTs(address: string): Promise<NormalizedNFT[]> {
  let history: RawHistoryEntry[];
  try {
    history = await getAccountHistory(address);
  } catch {
    return [];
  }

  const ownerPublicKey = accountToPublicKeyHex(address);
  const byHeight = new Map<number, RawHistoryEntry>();
  for (const entry of history) byHeight.set(Number(entry.height), entry);

  // Supply-block heights that a `#finish_supply` block has locked.
  const finishedSupplyHeights = new Set<number>();
  for (const entry of history) {
    if (entry.subtype !== 'change' || !entry.representative) continue;
    if (!isFinishSupplyRepresentative(entry.representative)) continue;
    finishedSupplyHeights.add(finishSupplyHeightFromRepresentative(entry.representative));
  }

  const results: NormalizedNFT[] = [];
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
    const { editions, supplyHeights } = collectEditions(
      history,
      mint.representative,
      maxSupply,
      ownerPublicKey,
    );
    if (editions.length === 0) continue;
    const finished = supplyHeights.some((h) => finishedSupplyHeights.has(h));

    const heldCount = editions.filter((e) => e.held).length;
    // Ownership gallery: skip collections where every edition was transferred
    // away. You minted them, but you no longer hold any copy.
    if (heldCount === 0) continue;
    const primary = editions.find((e) => e.held) ?? editions[0];
    const supplyType: NormalizedNFT['supplyType'] =
      maxSupply === 1 ? 'unique' : maxSupply === 0 ? 'unlimited' : 'limited';

    const metadata = await resolveMetadata(cid);
    const name = pickString(metadata, 'name', 'title') || `NFT ${primary.hash.slice(0, 6)}`;
    const image = ipfsToHttp(pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url'));
    const description = pickString(metadata, 'description');

    results.push({
      id: primary.hash,
      name,
      description,
      image,
      collection: 'Minted by you',
      assetRepresentative: primary.hash,
      supplyBlockHash: entry.hash,
      metadataCid: cid,
      maxSupply,
      mintedCount: editions.length,
      heldCount,
      supplyType,
      finished,
    });
  }

  return results;
}
