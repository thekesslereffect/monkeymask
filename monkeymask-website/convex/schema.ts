import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// MonkeyMask backend: durable SIWB storage + a self-hosted Banano NFT index.
//
// Ownership is keyed by the owner's 64-char public-key hex (uppercase) rather
// than the ban_ account. Decoding an account -> public key is a pure operation
// (no blake2b), while the reverse needs a checksum we can't compute in the
// Convex V8 runtime. Clients convert their account -> hex before querying.
export default defineSchema({
  // One row per minted asset (identified by its send#mint / #mint block hash).
  assets: defineTable({
    assetRep: v.string(), // mint block hash — the canonical asset id
    issuer: v.string(), // account that minted it (ban_...)
    issuerPubKey: v.string(), // issuer public key hex (uppercase)
    supplyBlockHash: v.optional(v.string()),
    metadataCid: v.optional(v.string()),
    maxSupply: v.optional(v.number()),
    mintHeight: v.optional(v.number()),
    // True once a `#finish_supply` block has locked this edition's supply block.
    finished: v.optional(v.boolean()),
    // Denormalized metadata for cheap reads.
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    collection: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_asset', ['assetRep'])
    .index('by_issuer', ['issuer'])
    // Group editions of a collection (all mints share one metadata CID).
    .index('by_metadataCid', ['metadataCid']),

  // Current owner of each asset (one row per asset).
  ownership: defineTable({
    assetRep: v.string(),
    ownerPubKey: v.string(), // uppercase hex
    // Latest block hash in the asset's chain (for future transfer tracing).
    headBlock: v.string(),
    source: v.string(), // "mint" | "transfer"
    updatedAt: v.number(),
  })
    .index('by_owner', ['ownerPubKey'])
    .index('by_asset', ['assetRep']),

  // Resolved IPFS metadata JSON, cached so we don't refetch on every crawl.
  metadataCache: defineTable({
    cid: v.string(),
    json: v.string(), // stringified metadata object
    fetchedAt: v.number(),
  }).index('by_cid', ['cid']),

  // Accounts we crawl (issuers we've discovered + owners who viewed galleries).
  crawlAccounts: defineTable({
    account: v.string(),
    pubKey: v.string(),
    lastCrawledAt: v.number(), // 0 = never
    lastHeight: v.number(),
    error: v.optional(v.string()),
  }).index('by_account', ['account']).index('by_lastCrawledAt', ['lastCrawledAt']),

  // --- SIWB durable storage ---
  siwbNonces: defineTable({
    nonce: v.string(),
    domain: v.string(),
    expiresAt: v.number(),
  }).index('by_nonce', ['nonce']),

  siwbSessions: defineTable({
    token: v.string(),
    address: v.string(),
    expiresAt: v.number(),
  }).index('by_token', ['token']),

  // Curated Banano ecosystem directory (extension explore + website).
  exploreSites: defineTable({
    slug: v.string(),
    name: v.string(),
    description: v.string(),
    url: v.string(),
    category: v.string(),
    featured: v.boolean(),
    sortOrder: v.number(),
    featuredSortOrder: v.optional(v.number()),
    iconUrl: v.optional(v.string()),
    enabled: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_enabled', ['enabled'])
    .index('by_category', ['category', 'sortOrder']),
});
