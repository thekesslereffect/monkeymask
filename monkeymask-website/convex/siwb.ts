import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';

// Durable Sign-In-With-Banano storage. These are internal — the trusted
// Next.js SIWB routes (which perform the cryptographic verification) call them
// through the HTTP layer for persistence only.

/** Record a freshly issued nonce bound to a domain. */
export const issueNonce = internalMutation({
  args: { nonce: v.string(), domain: v.string(), expiresAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('siwbNonces', {
      nonce: args.nonce,
      domain: args.domain,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

/**
 * Consume a nonce (single use). Returns its domain if valid & unexpired, else
 * null. Always deletes the row to prevent replay.
 */
export const consumeNonce = internalMutation({
  args: { nonce: v.string(), now: v.number() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('siwbNonces')
      .withIndex('by_nonce', (q) => q.eq('nonce', args.nonce))
      .unique();
    if (!row) return null;
    await ctx.db.delete(row._id);
    return row.expiresAt > args.now ? row.domain : null;
  },
});

/** Create a session token for an authenticated address. */
export const createSession = internalMutation({
  args: { token: v.string(), address: v.string(), expiresAt: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert('siwbSessions', {
      token: args.token,
      address: args.address,
      expiresAt: args.expiresAt,
    });
    return null;
  },
});

/** Look up an active session address, or null if missing/expired. */
export const getSession = internalQuery({
  args: { token: v.string(), now: v.number() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('siwbSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!row) return null;
    return row.expiresAt > args.now ? row.address : null;
  },
});

/** Revoke a session token. */
export const deleteSession = internalMutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('siwbSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (row) await ctx.db.delete(row._id);
    return null;
  },
});
