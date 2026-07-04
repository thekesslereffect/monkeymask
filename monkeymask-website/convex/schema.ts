import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// MonkeyMask backend: durable SIWB storage + the curated Explore directory.
//
// NFT ownership is intentionally NOT stored here. Clients derive it crawler-free
// straight from each account's ledger chain (see src/lib/nft.ts and the
// extension's utils/nft.ts), so no NFT index / crawler tables are needed.
export default defineSchema({
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

  // --- Faucet claim tracking ---
  // One row per claim (or in-flight claim). Cooldowns are enforced against the
  // newest row per address and per IP hash; failed sends delete their row so
  // the user can retry. `_creationTime` is the claim time.
  faucetClaims: defineTable({
    address: v.string(),
    /** SHA-256 of the claimer's IP (+ salt) — never the raw IP. */
    ipHash: v.string(),
    amountBan: v.string(),
    status: v.union(v.literal('pending'), v.literal('sent')),
    /** Send block hash, set once the payout is published. */
    hash: v.optional(v.string()),
  })
    .index('by_address', ['address'])
    .index('by_ipHash', ['ipHash']),

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
