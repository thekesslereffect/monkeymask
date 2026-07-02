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
