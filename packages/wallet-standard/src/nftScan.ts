// Wallet-local Banano NFT ownership scanner (no crawler, no third-party indexer).
//
// Banano NFTs (73-meta-tokens) are event-sourced across many account chains.
// "What NFTs does account X own?" is normally answered by a forward crawler that
// traces every asset from its mint block (banano-nft-crawler / banano-nft-node).
// That needs to know every issuer up front and a server to cache results.
//
// This module answers the SAME question from the RECEIVER's own chain instead,
// using a bounded, constant number of batched RPC calls regardless of history
// size:
//
//   1. account_history(you)                  -> mints you issued + your receives + your sends
//   1b. account_receivable(you)              -> NFTs sent to you but not yet claimed
//   2. blocks_info([receive + pending links])-> the source send behind each incoming asset
//   3. blocks_info([evidence hashes])        -> validate mint vs transfer, read supply
//   (4. blocks_info([supply of transfers])   -> optional maxSupply for received transfers)
//
// A `send#mint` received directly makes THIS send's hash the asset id; a
// `send#asset` transfer carries the asset id in its representative. Ownership is
// removed when your own chain later shows a matching `send#asset`, a `send#burn`,
// or a `send#all_nfts`. All removal is detected from step 1 with zero extra RPC.
//
// Pending (receivable) sends matter: a mint-to-self and any NFT someone sends you
// sit in your receivable queue until the wallet auto-claims them. Scanning
// receivable makes those show up immediately (as `pending`) without needing to
// open the wallet to pocket them first.

import {
  accountToPublicKeyHex,
  isSupplyRepresentative,
  isValidMetadataRepresentative,
  isFinishSupplyRepresentative,
  finishSupplyHeightFromRepresentative,
  isAtomicSwapRepresentative,
  maxSupplyFromRepresentative,
  metadataCidFromRepresentative,
  representativeMatchesAsset,
  SEND_ALL_NFTS_REPRESENTATIVE,
} from './nft.js';

/** A raw `account_history` entry (call with `raw: true`, sorted oldest first). */
export interface ScanHistoryEntry {
  hash: string;
  height: string | number;
  subtype?: string;
  representative?: string;
  /** For sends: recipient public key hex; for receives: source block hash. */
  link?: string;
  previous?: string;
}

/** A raw block as returned by `blocks_info` (with `json_block: true`). */
export interface ScanBlock {
  subtype?: string;
  representative?: string;
  link?: string;
  previous?: string;
  height?: string | number;
  /** The account whose chain this block belongs to (blocks_info `block_account`). */
  blockAccount?: string;
}

/** Transport: fetch a full raw history for an account, oldest block first. */
export type AccountHistoryFn = (account: string) => Promise<ScanHistoryEntry[]>;

/** Transport: batch-resolve block hashes to raw blocks. Missing hashes omitted. */
export type BlocksInfoFn = (hashes: string[]) => Promise<Map<string, ScanBlock>>;

/**
 * Transport: list the send-block hashes currently receivable (pending) by an
 * account. Optional: when omitted, NFTs sent to you only appear after you claim
 * the pending send. Should return confirmed receivable hashes only.
 */
export type AccountReceivableFn = (account: string) => Promise<string[]>;

/** One owned collection (editions grouped by metadata CID). */
export interface ScannedNFT {
  /** Asset representative of a held edition (its mint block hash). */
  assetRep: string;
  metadataCid?: string;
  supplyBlockHash?: string;
  /** Max editions (0 = unlimited). Known only when the supply block was seen. */
  maxSupply?: number;
  /** Editions minted in this collection. Known only for collections you issued. */
  mintedCount?: number;
  /** How many editions of this collection you currently hold. */
  heldCount: number;
  /** True once a `#finish_supply` locked the collection (issuer-side signal). */
  finished?: boolean;
  /** Where the primary edition came from. */
  source: 'minted' | 'received';
  /**
   * True when every held edition is still sitting in the account's receivable
   * queue (sent to you but not yet claimed). The wallet auto-pockets these; the
   * flag lets UIs show a "pending" hint. Absent/false once any edition is claimed.
   */
  pending?: boolean;
}

const HEX64 = /^[0-9A-F]{64}$/;

function toHeight(value: string | number | undefined): number {
  return value === undefined ? -1 : Number(value);
}

/** Chunk an array so a single `blocks_info` call never carries too many hashes. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Batch `blocks_info` over many hashes, merging the results into one map. */
async function loadBlocks(
  hashes: Iterable<string>,
  blocksInfo: BlocksInfoFn,
): Promise<Map<string, ScanBlock>> {
  const unique = [...new Set([...hashes].filter((h) => HEX64.test(h.toUpperCase())))];
  const merged = new Map<string, ScanBlock>();
  for (const group of chunk(unique, 500)) {
    if (group.length === 0) continue;
    let result: Map<string, ScanBlock>;
    try {
      result = await blocksInfo(group);
    } catch {
      continue; // best-effort: a failed batch just yields fewer confirmations
    }
    for (const [hash, block] of result) merged.set(hash.toUpperCase(), block);
  }
  return merged;
}

interface OwnedAsset {
  assetRep: string; // mint block hash (uppercase)
  metadataCid?: string;
  supplyBlockHash?: string;
  maxSupply?: number;
  finished?: boolean;
  source: 'minted' | 'received';
  /** Height on the owner's chain where the asset was acquired (mint or receive). */
  acquiredHeight: number;
  /** Still in the receivable queue (sent to you, not yet claimed). */
  pending?: boolean;
}

/**
 * Sentinel `acquiredHeight` for pending (receivable) assets: they have no block
 * on the owner's chain yet, and they're the most recent thing to arrive, so
 * treat them as "after everything" — no outbound send can have moved them.
 */
const PENDING_ACQUIRED_HEIGHT = Number.MAX_SAFE_INTEGER;

/**
 * Scan every NFT currently owned by `address` directly from the ledger.
 *
 * Never throws; returns an empty list on transport failure so callers can merge
 * it with other sources. Metadata (name/image) is intentionally NOT resolved
 * here: callers own IPFS gateway choice and caching.
 */
export async function scanOwnedNFTs(
  address: string,
  transport: {
    accountHistory: AccountHistoryFn;
    blocksInfo: BlocksInfoFn;
    /** Optional: include NFTs sent to you but not yet claimed (receivable). */
    accountReceivable?: AccountReceivableFn;
  },
): Promise<ScannedNFT[]> {
  let ownerPubKey: string;
  try {
    ownerPubKey = accountToPublicKeyHex(address).toUpperCase();
  } catch {
    return [];
  }

  let history: ScanHistoryEntry[];
  try {
    history = await transport.accountHistory(address);
  } catch {
    return [];
  }
  history.sort((a, b) => toHeight(a.height) - toHeight(b.height));

  const byHeight = new Map<number, ScanHistoryEntry>();
  for (const entry of history) byHeight.set(toHeight(entry.height), entry);

  // Supply-block heights this chain locked via `#finish_supply` (issuer view).
  const finishedSupplyHeights = new Set<number>();
  for (const entry of history) {
    if (entry.subtype !== 'change' || !entry.representative) continue;
    if (!isFinishSupplyRepresentative(entry.representative)) continue;
    finishedSupplyHeights.add(finishSupplyHeightFromRepresentative(entry.representative));
  }

  const owned = new Map<string, OwnedAsset>(); // key = assetRep (uppercase)
  const mintedCountByCid = new Map<string, number>();

  // --- Pass 1a: collections you MINTED (self-delimiting supply -> mint pairs) ---
  for (const entry of history) {
    if (entry.subtype !== 'change' || !entry.representative) continue;
    if (!isSupplyRepresentative(entry.representative)) continue;

    const supplyHeight = toHeight(entry.height);
    const mint = byHeight.get(supplyHeight + 1);
    if (!mint || mint.subtype !== 'send' || !mint.representative) continue;
    if (!isValidMetadataRepresentative(mint.representative)) continue;

    let cid: string;
    let maxSupply: number;
    try {
      cid = metadataCidFromRepresentative(mint.representative);
      maxSupply = maxSupplyFromRepresentative(entry.representative);
    } catch {
      continue;
    }

    mintedCountByCid.set(cid, (mintedCountByCid.get(cid) ?? 0) + 1);
    const heldByOwner = (mint.link ?? '').toUpperCase() === ownerPubKey;
    if (!heldByOwner) continue; // minted straight to someone else

    const assetRep = mint.hash.toUpperCase();
    owned.set(assetRep, {
      assetRep,
      metadataCid: cid,
      supplyBlockHash: entry.hash,
      maxSupply,
      finished: finishedSupplyHeights.has(supplyHeight),
      source: 'minted',
      acquiredHeight: toHeight(mint.height),
    });
  }

  // --- Pass 1b: gather the source sends behind every incoming asset ---
  // Received assets are found via the receive block's `link` (the source send).
  // Pending assets have no receive block yet, so we take their send hash straight
  // from account_receivable and treat them as arrived-but-unclaimed.
  const incomingToHeight = new Map<string, number>();
  for (const entry of history) {
    if (entry.subtype !== 'receive' && entry.subtype !== 'open') continue;
    const link = (entry.link ?? '').toUpperCase();
    if (HEX64.test(link)) incomingToHeight.set(link, toHeight(entry.height));
  }

  const pendingSends = new Set<string>();
  if (transport.accountReceivable) {
    let receivable: string[] = [];
    try {
      receivable = await transport.accountReceivable(address);
    } catch {
      receivable = []; // best-effort: no pending enrichment on failure
    }
    for (const raw of receivable) {
      const hash = raw.toUpperCase();
      if (!HEX64.test(hash) || incomingToHeight.has(hash)) continue;
      incomingToHeight.set(hash, PENDING_ACQUIRED_HEIGHT);
      pendingSends.add(hash);
    }
  }

  const sourceSends = await loadBlocks(incomingToHeight.keys(), transport.blocksInfo);

  // --- Pass 2: classify each incoming send as mint / transfer via evidence ---
  // A send is a `send#mint` if its previous block is a `change#supply`. It is a
  // `send#asset` if its representative decodes to a real mint block. Everything
  // else (plain payments) is ignored.
  interface Candidate {
    sendHash: string;
    rep: string;
    acquiredHeight: number;
    pending: boolean;
    previousHash?: string; // for mint detection + supply lookup
    transferMintHash?: string; // decoded asset rep, for transfer detection
  }
  const candidates: Candidate[] = [];
  const evidence = new Set<string>();

  for (const [linkHash, acquiredHeight] of incomingToHeight) {
    const send = sourceSends.get(linkHash);
    if (!send || send.subtype !== 'send' || !send.representative) continue;
    const rep = send.representative;
    if (rep === SEND_ALL_NFTS_REPRESENTATIVE || isAtomicSwapRepresentative(rep)) continue;
    if (!isValidMetadataRepresentative(rep)) continue;

    const candidate: Candidate = {
      sendHash: linkHash,
      rep,
      acquiredHeight,
      pending: pendingSends.has(linkHash),
    };
    if (send.previous && HEX64.test(send.previous.toUpperCase())) {
      candidate.previousHash = send.previous.toUpperCase();
      evidence.add(candidate.previousHash);
    }
    // The representative of a transfer decodes to the asset's mint block hash.
    try {
      const mintHash = accountToPublicKeyHex(rep).toUpperCase();
      if (HEX64.test(mintHash)) {
        candidate.transferMintHash = mintHash;
        evidence.add(mintHash);
      }
    } catch {
      /* rep is not a valid account -> not a transfer */
    }
    candidates.push(candidate);
  }

  const evidenceBlocks = await loadBlocks(evidence, transport.blocksInfo);

  // Transfers need the supply block that precedes the referenced mint to read
  // maxSupply. Collect those in one more batched round (only if any transfers).
  const transferSupplyHashes = new Set<string>();

  for (const c of candidates) {
    // Mint received directly: previous is a change#supply on the issuer chain.
    const prev = c.previousHash ? evidenceBlocks.get(c.previousHash) : undefined;
    const isMint =
      !!prev &&
      prev.subtype === 'change' &&
      !!prev.representative &&
      isSupplyRepresentative(prev.representative);

    if (isMint && prev) {
      const assetRep = c.sendHash;
      if (owned.has(assetRep)) continue;
      let cid: string | undefined;
      let maxSupply: number | undefined;
      try {
        cid = metadataCidFromRepresentative(c.rep);
        maxSupply = maxSupplyFromRepresentative(prev.representative!);
      } catch {
        continue;
      }
      owned.set(assetRep, {
        assetRep,
        metadataCid: cid,
        supplyBlockHash: c.previousHash,
        maxSupply,
        source: 'received',
        acquiredHeight: c.acquiredHeight,
        pending: c.pending,
      });
      continue;
    }

    // Transfer received: representative decodes to a real, valid mint block.
    if (c.transferMintHash) {
      const mint = evidenceBlocks.get(c.transferMintHash);
      if (!mint || mint.subtype !== 'send' || !mint.representative) continue;
      if (!isValidMetadataRepresentative(mint.representative)) continue;
      const assetRep = c.transferMintHash;
      if (owned.has(assetRep)) continue;
      let cid: string | undefined;
      try {
        cid = metadataCidFromRepresentative(mint.representative);
      } catch {
        continue;
      }
      const supplyHash = mint.previous?.toUpperCase();
      if (supplyHash && HEX64.test(supplyHash)) transferSupplyHashes.add(supplyHash);
      owned.set(assetRep, {
        assetRep,
        metadataCid: cid,
        supplyBlockHash: supplyHash,
        source: 'received',
        acquiredHeight: c.acquiredHeight,
        pending: c.pending,
      });
    }
  }

  // --- Optional round: supply blocks for received transfers (maxSupply) ---
  if (transferSupplyHashes.size > 0) {
    const supplyBlocks = await loadBlocks(transferSupplyHashes, transport.blocksInfo);
    for (const asset of owned.values()) {
      if (asset.source !== 'received' || asset.maxSupply !== undefined) continue;
      if (!asset.supplyBlockHash) continue;
      const supply = supplyBlocks.get(asset.supplyBlockHash);
      if (!supply || !supply.representative) continue;
      if (!isSupplyRepresentative(supply.representative)) continue;
      try {
        asset.maxSupply = maxSupplyFromRepresentative(supply.representative);
      } catch {
        /* leave undefined */
      }
    }
  }

  // --- Pass 3: remove assets you later sent away, burned, or swept (no RPC) ---
  let sendAllHeight = Infinity;
  for (const entry of history) {
    if (entry.subtype !== 'send' || !entry.representative) continue;
    if (entry.representative === SEND_ALL_NFTS_REPRESENTATIVE) {
      sendAllHeight = Math.min(sendAllHeight, toHeight(entry.height));
    }
  }

  for (const entry of history) {
    if (entry.subtype !== 'send' || !entry.representative) continue;
    const outHeight = toHeight(entry.height);
    for (const asset of [...owned.values()]) {
      if (outHeight <= asset.acquiredHeight) continue;
      if (representativeMatchesAsset(entry.representative, asset.assetRep)) {
        owned.delete(asset.assetRep); // transferred or burned away
      }
    }
  }
  if (sendAllHeight !== Infinity) {
    for (const asset of [...owned.values()]) {
      if (asset.acquiredHeight < sendAllHeight) owned.delete(asset.assetRep);
    }
  }
  // Note: `representativeMatchesAsset` treats SEND_ALL_NFTS as matching every
  // asset, so the per-send loop above already clears assets a send#all_nfts moved
  // that were acquired before it; the explicit sweep pass covers any ordering.

  // --- Group surviving assets by metadata CID (editions share one CID) ---
  interface Group {
    primary: OwnedAsset;
    heldCount: number;
    finished: boolean;
    /** True while every edition in this group is still unclaimed. */
    allPending: boolean;
  }
  const groups = new Map<string, Group>();
  for (const asset of owned.values()) {
    const key = asset.metadataCid ?? asset.assetRep;
    const existing = groups.get(key);
    if (existing) {
      existing.heldCount += 1;
      if (asset.finished) existing.finished = true;
      if (!asset.pending) existing.allPending = false;
      // Prefer a minted-source primary (richest data) when available.
      if (existing.primary.source === 'received' && asset.source === 'minted') {
        existing.primary = asset;
      }
    } else {
      groups.set(key, {
        primary: asset,
        heldCount: 1,
        finished: Boolean(asset.finished),
        allPending: Boolean(asset.pending),
      });
    }
  }

  const results: ScannedNFT[] = [];
  for (const group of groups.values()) {
    const { primary, heldCount } = group;
    const mintedCount = primary.metadataCid
      ? mintedCountByCid.get(primary.metadataCid)
      : undefined;
    results.push({
      assetRep: primary.assetRep,
      metadataCid: primary.metadataCid,
      supplyBlockHash: primary.supplyBlockHash,
      maxSupply: primary.maxSupply,
      mintedCount,
      heldCount,
      finished: group.finished,
      source: primary.source,
      pending: group.allPending || undefined,
    });
  }
  return results;
}
