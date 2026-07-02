// SIWB nonce + session store.
//
// When Convex is configured (CONVEX_SITE_URL / NEXT_PUBLIC_CONVEX_URL) this
// delegates to durable Convex storage so nonces/sessions survive cold starts and
// are shared across serverless instances (proper replay protection). Otherwise
// it falls back to a process-local in-memory store — fine for local dev and
// single-instance deployments, but not durable. The interface is async either
// way so route handlers don't care which backend is active.

import { convexEnabled, convexPost } from './convexClient';

const NONCE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface NonceRecord {
  domain: string;
  expiresAt: number;
}

interface SessionRecord {
  address: string;
  expiresAt: number;
}

interface SiwbStore {
  nonces: Map<string, NonceRecord>;
  sessions: Map<string, SessionRecord>;
}

// Persist across dev HMR / module re-evaluation by hanging off globalThis.
const globalRef = globalThis as unknown as { __monkeymaskSiwbStore?: SiwbStore };
const store: SiwbStore =
  globalRef.__monkeymaskSiwbStore ?? { nonces: new Map(), sessions: new Map() };
globalRef.__monkeymaskSiwbStore = store;

function cleanup(now = Date.now()): void {
  for (const [key, value] of store.nonces) {
    if (value.expiresAt <= now) store.nonces.delete(key);
  }
  for (const [key, value] of store.sessions) {
    if (value.expiresAt <= now) store.sessions.delete(key);
  }
}

/** Record a freshly-issued nonce bound to a domain. */
export async function issueNonce(nonce: string, domain: string): Promise<void> {
  if (convexEnabled()) {
    await convexPost('/siwb/issueNonce', { nonce, domain, expiresAt: Date.now() + NONCE_TTL_MS });
    return;
  }
  cleanup();
  store.nonces.set(nonce, { domain, expiresAt: Date.now() + NONCE_TTL_MS });
}

/**
 * Consume a nonce (single-use). Returns its record if valid & unexpired, else
 * null. The entry is always removed to prevent replay.
 */
export async function consumeNonce(nonce: string | undefined | null): Promise<NonceRecord | null> {
  if (!nonce) return null;
  if (convexEnabled()) {
    const { domain } = await convexPost<{ domain: string | null }>('/siwb/consumeNonce', { nonce });
    return domain ? { domain, expiresAt: 0 } : null;
  }
  cleanup();
  const record = store.nonces.get(nonce);
  if (!record) return null;
  store.nonces.delete(nonce);
  if (record.expiresAt <= Date.now()) return null;
  return record;
}

/** Create a session token for an authenticated address. */
export async function createSession(address: string): Promise<string> {
  const token = crypto.randomUUID();
  if (convexEnabled()) {
    await convexPost('/siwb/createSession', { token, address, expiresAt: Date.now() + SESSION_TTL_MS });
    return token;
  }
  cleanup();
  store.sessions.set(token, { address, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

/** Look up an active session, or null if missing/expired. */
export async function getSession(token: string | undefined | null): Promise<SessionRecord | null> {
  if (!token) return null;
  if (convexEnabled()) {
    const { address } = await convexPost<{ address: string | null }>('/siwb/getSession', { token });
    return address ? { address, expiresAt: 0 } : null;
  }
  cleanup();
  const record = store.sessions.get(token);
  if (!record) return null;
  if (record.expiresAt <= Date.now()) {
    store.sessions.delete(token);
    return null;
  }
  return record;
}

/** Revoke a session token. */
export async function deleteSession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  if (convexEnabled()) {
    await convexPost('/siwb/deleteSession', { token });
    return;
  }
  store.sessions.delete(token);
}

export const SIWB_TTL = { NONCE_TTL_MS, SESSION_TTL_MS };
