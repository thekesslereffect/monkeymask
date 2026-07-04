import { v } from 'convex/values';
import { internalMutation, internalQuery } from './_generated/server';

// Faucet claim tracking. These are internal — the trusted Next.js faucet route
// (which verifies the SIWB session and publishes the payout) calls them through
// the HTTP layer.
//
// The flow is reserve → send → confirm/release:
//  1. `reserveClaim` atomically checks the per-address and per-IP cooldowns and
//     inserts a `pending` row. Because a Convex mutation is a transaction, two
//     concurrent requests can never both pass the cooldown check.
//  2. The Next.js route publishes the send block from the server wallet.
//  3. `confirmClaim` records the block hash, or `releaseClaim` deletes the row
//     if the send failed so the user can immediately retry.

const reserveResult = v.union(
  v.object({ ok: v.literal(true), claimId: v.id('faucetClaims') }),
  v.object({ ok: v.literal(false), retryAfterMs: v.number() }),
);

/**
 * Atomically reserve a claim if neither the address nor the IP is cooling
 * down. Returns the claim id, or how long the caller must wait.
 */
export const reserveClaim = internalMutation({
  args: {
    address: v.string(),
    ipHash: v.string(),
    amountBan: v.string(),
    cooldownMs: v.number(),
    now: v.number(),
  },
  returns: reserveResult,
  handler: async (ctx, args) => {
    const cutoff = args.now - args.cooldownMs;

    const [latestForAddress, latestForIp] = await Promise.all([
      ctx.db
        .query('faucetClaims')
        .withIndex('by_address', (q) => q.eq('address', args.address))
        .order('desc')
        .first(),
      ctx.db
        .query('faucetClaims')
        .withIndex('by_ipHash', (q) => q.eq('ipHash', args.ipHash))
        .order('desc')
        .first(),
    ]);

    const blocking = [latestForAddress, latestForIp].filter(
      (claim): claim is NonNullable<typeof claim> =>
        claim !== null && claim._creationTime > cutoff,
    );
    if (blocking.length > 0) {
      const newest = Math.max(...blocking.map((c) => c._creationTime));
      return { ok: false as const, retryAfterMs: newest + args.cooldownMs - args.now };
    }

    const claimId = await ctx.db.insert('faucetClaims', {
      address: args.address,
      ipHash: args.ipHash,
      amountBan: args.amountBan,
      status: 'pending',
    });
    return { ok: true as const, claimId };
  },
});

/** Record the payout block hash after a successful send. */
export const confirmClaim = internalMutation({
  args: { claimId: v.id('faucetClaims'), hash: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.claimId, { status: 'sent', hash: args.hash });
    return null;
  },
});

/** Release a reservation whose send failed, so the user can retry at once. */
export const releaseClaim = internalMutation({
  args: { claimId: v.id('faucetClaims') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.claimId);
    if (claim) await ctx.db.delete(args.claimId);
    return null;
  },
});

/**
 * When may this address/IP claim again? Returns 0 when a claim is allowed now;
 * used by the UI to show the countdown without attempting a claim.
 */
export const getCooldown = internalQuery({
  args: {
    address: v.string(),
    ipHash: v.string(),
    cooldownMs: v.number(),
    now: v.number(),
  },
  returns: v.object({ retryAfterMs: v.number() }),
  handler: async (ctx, args) => {
    const [latestForAddress, latestForIp] = await Promise.all([
      ctx.db
        .query('faucetClaims')
        .withIndex('by_address', (q) => q.eq('address', args.address))
        .order('desc')
        .first(),
      ctx.db
        .query('faucetClaims')
        .withIndex('by_ipHash', (q) => q.eq('ipHash', args.ipHash))
        .order('desc')
        .first(),
    ]);
    const newest = Math.max(
      latestForAddress?._creationTime ?? 0,
      latestForIp?._creationTime ?? 0,
    );
    return { retryAfterMs: Math.max(0, newest + args.cooldownMs - args.now) };
  },
});
