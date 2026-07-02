import { v } from 'convex/values';
import { query, internalQuery, internalMutation } from './_generated/server';

// Stable NFT shape returned to clients (matches NormalizedNFT / MonkeyNFT).
const nftValidator = v.object({
  id: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  image: v.optional(v.string()),
  collection: v.optional(v.string()),
  assetRepresentative: v.optional(v.string()),
  supplyBlockHash: v.optional(v.string()),
  metadataCid: v.optional(v.string()),
  maxSupply: v.optional(v.number()),
  mintedCount: v.optional(v.number()),
  heldCount: v.optional(v.number()),
  supplyType: v.optional(
    v.union(v.literal('unique'), v.literal('limited'), v.literal('unlimited')),
  ),
});

function supplyTypeFor(maxSupply: number | undefined): 'unique' | 'limited' | 'unlimited' | undefined {
  if (maxSupply === undefined) return undefined;
  if (maxSupply === 1) return 'unique';
  if (maxSupply === 0) return 'unlimited';
  return 'limited';
}

/**
 * List the NFTs currently owned by `ownerPubKey` (uppercase public-key hex).
 * Reactive: updates automatically as the crawler records new mints/transfers.
 *
 * Editions of a collection are distinct assets that share one metadata CID, so
 * we group owned editions into a single card and report the supply model, the
 * total minted, and how many copies this owner holds — mirroring the wallet's
 * self-indexed cards so the count always displays regardless of source.
 */
export const nftsByOwner = query({
  args: { ownerPubKey: v.string() },
  returns: v.array(nftValidator),
  handler: async (ctx, args) => {
    const owner = args.ownerPubKey.toUpperCase();
    const owned = await ctx.db
      .query('ownership')
      .withIndex('by_owner', (q) => q.eq('ownerPubKey', owner))
      .collect();

    // Load each owned asset, grouping editions by metadata CID (assets without a
    // CID stand alone, keyed by their asset rep).
    interface Group {
      primary: {
        assetRep: string;
        name?: string;
        description?: string;
        image?: string;
        collection?: string;
        supplyBlockHash?: string;
        metadataCid?: string;
        maxSupply?: number;
      };
      heldCount: number;
    }
    const groups = new Map<string, Group>();
    for (const row of owned) {
      const asset = await ctx.db
        .query('assets')
        .withIndex('by_asset', (q) => q.eq('assetRep', row.assetRep))
        .unique();
      if (!asset) continue;
      const key = asset.metadataCid ?? asset.assetRep;
      const existing = groups.get(key);
      if (existing) {
        existing.heldCount += 1;
      } else {
        groups.set(key, {
          primary: {
            assetRep: asset.assetRep,
            name: asset.name,
            description: asset.description,
            image: asset.image,
            collection: asset.collection,
            supplyBlockHash: asset.supplyBlockHash,
            metadataCid: asset.metadataCid,
            maxSupply: asset.maxSupply,
          },
          heldCount: 1,
        });
      }
    }

    const results = [];
    for (const group of groups.values()) {
      const { primary, heldCount } = group;
      // Total editions ever minted for this collection (all issuers' mints share
      // the CID). Falls back to the held count when there's no CID to group by.
      let mintedCount = heldCount;
      if (primary.metadataCid) {
        const all = await ctx.db
          .query('assets')
          .withIndex('by_metadataCid', (q) => q.eq('metadataCid', primary.metadataCid))
          .collect();
        if (all.length > 0) mintedCount = all.length;
      }
      results.push({
        id: primary.assetRep,
        name: primary.name ?? `NFT ${primary.assetRep.slice(0, 6)}`,
        description: primary.description,
        image: primary.image,
        collection: primary.collection,
        assetRepresentative: primary.assetRep,
        supplyBlockHash: primary.supplyBlockHash,
        metadataCid: primary.metadataCid,
        maxSupply: primary.maxSupply,
        mintedCount,
        heldCount,
        supplyType: supplyTypeFor(primary.maxSupply),
      });
    }
    return results;
  },
});

/** Cached metadata JSON for a CID, if present. */
export const getMetadata = internalQuery({
  args: { cid: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('metadataCache')
      .withIndex('by_cid', (q) => q.eq('cid', args.cid))
      .unique();
    return row ? row.json : null;
  },
});

/** Cache resolved metadata JSON for a CID. */
export const upsertMetadata = internalMutation({
  args: { cid: v.string(), json: v.string(), now: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('metadataCache')
      .withIndex('by_cid', (q) => q.eq('cid', args.cid))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { json: args.json, fetchedAt: args.now });
    } else {
      await ctx.db.insert('metadataCache', { cid: args.cid, json: args.json, fetchedAt: args.now });
    }
    return null;
  },
});

/** Insert or update an asset record discovered by the crawler. */
export const upsertAsset = internalMutation({
  args: {
    assetRep: v.string(),
    issuer: v.string(),
    issuerPubKey: v.string(),
    supplyBlockHash: v.optional(v.string()),
    metadataCid: v.optional(v.string()),
    maxSupply: v.optional(v.number()),
    mintHeight: v.optional(v.number()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    collection: v.optional(v.string()),
    now: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { assetRep, now, ...fields } = args;
    const existing = await ctx.db
      .query('assets')
      .withIndex('by_asset', (q) => q.eq('assetRep', assetRep))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { ...fields, updatedAt: now });
    } else {
      await ctx.db.insert('assets', { assetRep, ...fields, createdAt: now, updatedAt: now });
    }
    return null;
  },
});

/** Record (or move) ownership of an asset. */
export const setOwnership = internalMutation({
  args: {
    assetRep: v.string(),
    ownerPubKey: v.string(),
    headBlock: v.string(),
    source: v.string(),
    now: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('ownership')
      .withIndex('by_asset', (q) => q.eq('assetRep', args.assetRep))
      .unique();
    const ownerPubKey = args.ownerPubKey.toUpperCase();
    if (existing) {
      await ctx.db.patch(existing._id, {
        ownerPubKey,
        headBlock: args.headBlock,
        source: args.source,
        updatedAt: args.now,
      });
    } else {
      await ctx.db.insert('ownership', {
        assetRep: args.assetRep,
        ownerPubKey,
        headBlock: args.headBlock,
        source: args.source,
        updatedAt: args.now,
      });
    }
    return null;
  },
});
