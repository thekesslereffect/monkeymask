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
});

/**
 * List the NFTs currently owned by `ownerPubKey` (uppercase public-key hex).
 * Reactive: updates automatically as the crawler records new mints/transfers.
 */
export const nftsByOwner = query({
  args: { ownerPubKey: v.string() },
  returns: v.array(nftValidator),
  handler: async (ctx, args) => {
    const owned = await ctx.db
      .query('ownership')
      .withIndex('by_owner', (q) => q.eq('ownerPubKey', args.ownerPubKey.toUpperCase()))
      .collect();

    const results = [];
    for (const row of owned) {
      const asset = await ctx.db
        .query('assets')
        .withIndex('by_asset', (q) => q.eq('assetRep', row.assetRep))
        .unique();
      if (!asset) continue;
      results.push({
        id: asset.assetRep,
        name: asset.name ?? `NFT ${asset.assetRep.slice(0, 6)}`,
        description: asset.description,
        image: asset.image,
        collection: asset.collection,
        assetRepresentative: asset.assetRep,
        supplyBlockHash: asset.supplyBlockHash,
        metadataCid: asset.metadataCid,
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
