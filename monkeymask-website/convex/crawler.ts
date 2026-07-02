import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction, internalMutation, internalQuery, type ActionCtx } from './_generated/server';
import {
  accountToPublicKeyHex,
  publicKeyHexToAccount,
  representativeMatchesAsset,
  isSupplyRepresentative,
  isValidMetadataRepresentative,
  isFinishSupplyRepresentative,
  finishSupplyHeightFromRepresentative,
  maxSupplyFromRepresentative,
  metadataCidFromRepresentative,
  ipfsToHttp,
  BURN_ACCOUNTS,
} from './lib/nftCodec';

const RPC_URL = process.env.BANANO_RPC_URL ?? 'https://kaliumapi.appditto.com/api';
const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? 'https://ipfs.io/ipfs/';
const REQUEST_TIMEOUT_MS = 10_000;
const STALE_MS = 5 * 60 * 1000; // re-crawl accounts older than 5 minutes
const CRAWL_BATCH = 25;
const MAX_TRANSFER_HOPS = 40; // per-asset chain-of-custody hop cap
const MAX_TRACE_RPC = 300; // per-crawl budget for extra history fetches while tracing

interface RawHistoryEntry {
  hash: string;
  height: string;
  subtype?: string;
  representative?: string;
  link?: string;
}

/**
 * Fetches account histories on demand, caching each account for the duration of
 * a crawl and enforcing a shared RPC budget so a single crawl can't fan out
 * unboundedly while tracing transfers.
 */
class HistoryLoader {
  private cache = new Map<string, RawHistoryEntry[]>();
  private spent = 0;

  constructor(private readonly budget: number) {}

  seed(account: string, history: RawHistoryEntry[]): void {
    this.cache.set(account, history);
  }

  async load(account: string): Promise<RawHistoryEntry[] | null> {
    const cached = this.cache.get(account);
    if (cached) return cached;
    if (this.spent >= this.budget) return null;
    this.spent += 1;
    try {
      const history = await getAccountHistory(account);
      this.cache.set(account, history);
      return history;
    } catch {
      this.cache.set(account, []);
      return [];
    }
  }
}

async function fetchJson(url: string, init: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getAccountHistory(account: string): Promise<RawHistoryEntry[]> {
  const payload = (await fetchJson(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'account_history', account, count: -1, raw: true }),
  })) as { history?: RawHistoryEntry[]; error?: string };
  if (payload.error) throw new Error(payload.error);
  const history = Array.isArray(payload.history) ? payload.history : [];
  return history.sort((a, b) => Number(a.height) - Number(b.height));
}

function pickString(record: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const val = record[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return undefined;
}

/** Register an account for crawling and kick off an immediate crawl. */
export const registerAccount = internalMutation({
  args: { account: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('crawlAccounts')
      .withIndex('by_account', (q) => q.eq('account', args.account))
      .unique();
    if (!existing) {
      let pubKey = '';
      try {
        pubKey = accountToPublicKeyHex(args.account);
      } catch {
        return null; // not a valid account — ignore
      }
      await ctx.db.insert('crawlAccounts', {
        account: args.account,
        pubKey,
        lastCrawledAt: 0,
        lastHeight: 0,
      });
    }
    await ctx.scheduler.runAfter(0, internal.crawler.crawlAccount, { account: args.account });
    return null;
  },
});

export const touchCrawlAccount = internalMutation({
  args: {
    account: v.string(),
    pubKey: v.string(),
    lastHeight: v.number(),
    now: v.number(),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('crawlAccounts')
      .withIndex('by_account', (q) => q.eq('account', args.account))
      .unique();
    const patch = {
      pubKey: args.pubKey,
      lastCrawledAt: args.now,
      lastHeight: args.lastHeight,
      error: args.error,
    };
    if (existing) await ctx.db.patch(existing._id, patch);
    else await ctx.db.insert('crawlAccounts', { account: args.account, ...patch });
    return null;
  },
});

export const dueForCrawl = internalQuery({
  args: { before: v.number(), limit: v.number() },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query('crawlAccounts')
      .withIndex('by_lastCrawledAt', (q) => q.lt('lastCrawledAt', args.before))
      .take(args.limit);
    return rows.map((r) => r.account);
  },
});

interface TraceResult {
  ownerPubKey: string; // uppercase hex
  headBlock: string;
  source: 'mint' | 'transfer' | 'burn';
}

/**
 * Follow an asset forward from its mint block through the ledger to find its
 * current owner, mirroring banano-nft-crawler's AssetCrawler:
 *
 *   receivable → (recipient receives) → owned → (owner send#asset) → receivable …
 *
 * A `send#asset` is any send whose `representative` encodes the asset's mint
 * hash. Sends to a burn account destroy the asset. Atomic swaps are not traced
 * (rare); the chain simply stops at the last plain owner. Bounded by a hop cap
 * and a shared RPC budget so a crawl can never fan out unboundedly.
 */
async function traceAsset(
  mint: RawHistoryEntry,
  issuerAccount: string,
  issuerPubKey: string,
  loader: HistoryLoader,
): Promise<TraceResult> {
  const mintHash = mint.hash;
  let state: 'receivable' | 'owned';
  let ownerAccount: string;
  let ownerPubKey: string;
  let cursorHash: string; // owned: frontier block hash; receivable: the send hash to receive
  let source: 'mint' | 'transfer' = 'mint';

  if (mint.subtype === 'change') {
    state = 'owned';
    ownerAccount = issuerAccount;
    ownerPubKey = issuerPubKey;
    cursorHash = mintHash;
  } else {
    const recipient = (mint.link ?? '').toUpperCase();
    if (recipient.length !== 64) {
      return { ownerPubKey: issuerPubKey, headBlock: mintHash, source: 'mint' };
    }
    let recipientAccount: string;
    try {
      recipientAccount = publicKeyHexToAccount(recipient);
    } catch {
      return { ownerPubKey: recipient, headBlock: mintHash, source: 'mint' };
    }
    state = 'receivable';
    ownerPubKey = recipient;
    ownerAccount = recipientAccount;
    cursorHash = mintHash;
  }

  for (let hops = 0; hops < MAX_TRANSFER_HOPS; hops++) {
    const history = await loader.load(ownerAccount);
    if (history === null) break; // out of RPC budget — stop at best-known owner

    if (state === 'receivable') {
      const receive = history.find(
        (b) =>
          (b.subtype === 'receive' || b.subtype === 'open') &&
          (b.link ?? '').toUpperCase() === cursorHash.toUpperCase(),
      );
      if (!receive) {
        // Sent but not yet pocketed — recipient is the (pending) owner.
        return { ownerPubKey, headBlock: cursorHash, source };
      }
      state = 'owned';
      cursorHash = receive.hash;
      continue;
    }

    // owned: find the first send#asset for this asset after the frontier block.
    const frontier = history.find((b) => b.hash.toUpperCase() === cursorHash.toUpperCase());
    const frontierHeight = frontier ? Number(frontier.height) : -1;
    const assetSend = history
      .filter(
        (b) =>
          b.subtype === 'send' &&
          Number(b.height) > frontierHeight &&
          !!b.representative &&
          representativeMatchesAsset(b.representative, mintHash),
      )
      .sort((a, b) => Number(a.height) - Number(b.height))[0];

    if (!assetSend) {
      return { ownerPubKey, headBlock: cursorHash, source }; // owner still holds it
    }

    const recipient = (assetSend.link ?? '').toUpperCase();
    let recipientAccount: string;
    try {
      recipientAccount = publicKeyHexToAccount(recipient);
    } catch {
      return { ownerPubKey, headBlock: cursorHash, source };
    }
    if (BURN_ACCOUNTS.has(recipientAccount)) {
      return { ownerPubKey: recipient, headBlock: assetSend.hash, source: 'burn' };
    }
    source = 'transfer';
    ownerPubKey = recipient;
    ownerAccount = recipientAccount;
    cursorHash = assetSend.hash;
    state = 'receivable';
  }

  return { ownerPubKey, headBlock: cursorHash, source };
}

/**
 * Crawl a single account's history: index every NFT it minted, then trace each
 * asset forward across the ledger to record its current owner (following
 * send#asset / receive#asset transfers and burns). Resolves + caches metadata.
 *
 * Assets minted by an issuer we never crawl (received from a stranger) are not
 * discovered here; forward tracing from every issuer we do crawl covers mints
 * created with MonkeyMask plus anything viewed in a gallery.
 */
export const crawlAccount = internalAction({
  args: { account: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    let pubKey = '';
    try {
      pubKey = accountToPublicKeyHex(args.account);
    } catch {
      return null;
    }

    let history: RawHistoryEntry[];
    try {
      history = await getAccountHistory(args.account);
    } catch (error) {
      await ctx.runMutation(internal.crawler.touchCrawlAccount, {
        account: args.account,
        pubKey,
        lastHeight: 0,
        now,
        error: error instanceof Error ? error.message : 'crawl failed',
      });
      return null;
    }

    const byHeight = new Map<number, RawHistoryEntry>();
    for (const entry of history) byHeight.set(Number(entry.height), entry);

    // Supply-block heights locked by a `#finish_supply` block on this chain.
    const finishedSupplyHeights = new Set<number>();
    for (const entry of history) {
      if (entry.subtype !== 'change' || !entry.representative) continue;
      if (!isFinishSupplyRepresentative(entry.representative)) continue;
      finishedSupplyHeights.add(finishSupplyHeightFromRepresentative(entry.representative));
    }

    const loader = new HistoryLoader(MAX_TRACE_RPC);
    loader.seed(args.account, history);

    for (const entry of history) {
      if (entry.subtype !== 'change') continue;
      if (!entry.representative || !isSupplyRepresentative(entry.representative)) continue;

      const mint = byHeight.get(Number(entry.height) + 1);
      if (!mint || !mint.representative) continue;
      if (!isValidMetadataRepresentative(mint.representative)) continue;

      let cid: string;
      let maxSupply: number | undefined;
      try {
        cid = metadataCidFromRepresentative(mint.representative);
        maxSupply = maxSupplyFromRepresentative(entry.representative);
      } catch {
        continue;
      }

      const metadata = await resolveMetadata(ctx, cid, now);
      const name = pickString(metadata, 'name', 'title') ?? `NFT ${mint.hash.slice(0, 6)}`;
      const image = ipfsToHttp(
        pickString(metadata, 'image', 'image_url', 'imageUrl', 'animation_url'),
        IPFS_GATEWAY,
      );
      const description = pickString(metadata, 'description');
      const collection = pickString(metadata, 'collection');

      await ctx.runMutation(internal.nfts.upsertAsset, {
        assetRep: mint.hash,
        issuer: args.account,
        issuerPubKey: pubKey,
        supplyBlockHash: entry.hash,
        metadataCid: cid,
        maxSupply,
        mintHeight: Number(mint.height),
        finished: finishedSupplyHeights.has(Number(entry.height)),
        name,
        image,
        description,
        collection,
        now,
      });

      // Trace the asset forward to its current owner. On any failure, fall back
      // to the initial owner (mint recipient) so we never regress.
      let owner: TraceResult;
      try {
        owner = await traceAsset(mint, args.account, pubKey, loader);
      } catch {
        const fallback = mint.subtype === 'send' ? (mint.link ?? '').toUpperCase() : pubKey;
        owner = { ownerPubKey: fallback, headBlock: mint.hash, source: 'mint' };
      }
      if (owner.ownerPubKey.length === 64) {
        await ctx.runMutation(internal.nfts.setOwnership, {
          assetRep: mint.hash,
          ownerPubKey: owner.ownerPubKey,
          headBlock: owner.headBlock,
          source: owner.source,
          now,
        });
      }
    }

    const maxHeight = history.length ? Number(history[history.length - 1].height) : 0;
    await ctx.runMutation(internal.crawler.touchCrawlAccount, {
      account: args.account,
      pubKey,
      lastHeight: maxHeight,
      now,
    });
    return null;
  },
});

async function resolveMetadata(
  ctx: ActionCtx,
  cid: string,
  now: number,
): Promise<Record<string, unknown> | null> {
  const cached: string | null = await ctx.runQuery(internal.nfts.getMetadata, { cid });
  if (cached) {
    try {
      return JSON.parse(cached) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  const url = ipfsToHttp(cid, IPFS_GATEWAY);
  if (!url) return null;
  try {
    const json = await fetchJson(url, { headers: { Accept: 'application/json' } });
    if (json && typeof json === 'object') {
      await ctx.runMutation(internal.nfts.upsertMetadata, {
        cid,
        json: JSON.stringify(json),
        now,
      });
      return json as Record<string, unknown>;
    }
  } catch {
    // ignore — metadata resolves lazily on a later crawl
  }
  return null;
}

/** Cron target: re-crawl the stalest registered accounts. */
export const crawlStale = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const due: string[] = await ctx.runQuery(internal.crawler.dueForCrawl, {
      before: now - STALE_MS,
      limit: CRAWL_BATCH,
    });
    for (const account of due) {
      await ctx.runAction(internal.crawler.crawlAccount, { account });
    }
    return null;
  },
});
