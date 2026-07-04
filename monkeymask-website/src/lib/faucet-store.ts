// Faucet claim tracking (cooldowns) + config.
//
// Like the SIWB store, this delegates to durable Convex storage when configured
// (proper cross-instance cooldowns) and falls back to a process-local in-memory
// store for local dev. The Next.js faucet route owns authentication (SIWB
// session) and the actual payout; this module only answers "may this
// address/IP claim right now?" atomically.

import { createHash } from 'crypto';
import { convexEnabled, convexPost } from './convexClient';

/** BAN paid per claim. Override with FAUCET_CLAIM_BAN. */
export const FAUCET_CLAIM_BAN = process.env.FAUCET_CLAIM_BAN?.trim() || '0.19';

/** Cooldown between claims per address AND per IP. Override with FAUCET_COOLDOWN_HOURS. */
export const FAUCET_COOLDOWN_MS =
  (Number(process.env.FAUCET_COOLDOWN_HOURS) || 24) * 60 * 60 * 1000;

export type ReserveResult =
  | { ok: true; claimId: string }
  | { ok: false; retryAfterMs: number };

interface MemoryClaim {
  address: string;
  ipHash: string;
  createdAt: number;
}

// Survive dev HMR by hanging off globalThis (matches the SIWB store).
const globalRef = globalThis as unknown as { __monkeymaskFaucetClaims?: MemoryClaim[] };
const memoryClaims: MemoryClaim[] = globalRef.__monkeymaskFaucetClaims ?? [];
globalRef.__monkeymaskFaucetClaims = memoryClaims;

/**
 * Hash the caller's IP so cooldowns can be tracked without storing raw IPs.
 * Set FAUCET_IP_SALT in production so hashes can't be reversed by dictionary.
 */
export function hashIp(request: Request): string {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    'unknown';
  const salt = process.env.FAUCET_IP_SALT ?? 'monkeymask-faucet';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex');
}

function memoryRetryAfter(address: string, ipHash: string, now: number): number {
  const newest = memoryClaims
    .filter((c) => c.address === address || c.ipHash === ipHash)
    .reduce((max, c) => Math.max(max, c.createdAt), 0);
  return Math.max(0, newest + FAUCET_COOLDOWN_MS - now);
}

/**
 * Atomically reserve a claim slot for (address, ipHash), or report how long
 * the caller must wait. A reservation MUST be followed by `confirmClaim` or
 * `releaseClaim`.
 */
export async function reserveClaim(address: string, ipHash: string): Promise<ReserveResult> {
  if (convexEnabled()) {
    return convexPost<ReserveResult>('/faucet/reserveClaim', {
      address,
      ipHash,
      amountBan: FAUCET_CLAIM_BAN,
      cooldownMs: FAUCET_COOLDOWN_MS,
    });
  }
  const now = Date.now();
  const retryAfterMs = memoryRetryAfter(address, ipHash, now);
  if (retryAfterMs > 0) return { ok: false, retryAfterMs };
  memoryClaims.push({ address, ipHash, createdAt: now });
  return { ok: true, claimId: `${address}:${now}` };
}

/** Record the payout block hash for a reserved claim. */
export async function confirmClaim(claimId: string, hash: string): Promise<void> {
  if (convexEnabled()) {
    await convexPost('/faucet/confirmClaim', { claimId, hash });
  }
  // Memory backend: the pushed claim already counts toward the cooldown.
}

/** Release a reservation whose send failed so the user can retry immediately. */
export async function releaseClaim(claimId: string): Promise<void> {
  if (convexEnabled()) {
    await convexPost('/faucet/releaseClaim', { claimId });
    return;
  }
  const [address, createdAt] = claimId.split(':');
  const index = memoryClaims.findIndex(
    (c) => c.address === address && String(c.createdAt) === createdAt,
  );
  if (index >= 0) memoryClaims.splice(index, 1);
}

/** How long until (address, ipHash) may claim? 0 means claimable now. */
export async function getCooldown(address: string, ipHash: string): Promise<number> {
  if (convexEnabled()) {
    const { retryAfterMs } = await convexPost<{ retryAfterMs: number }>('/faucet/getCooldown', {
      address,
      ipHash,
      cooldownMs: FAUCET_COOLDOWN_MS,
    });
    return retryAfterMs;
  }
  return memoryRetryAfter(address, ipHash, Date.now());
}
