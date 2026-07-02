// Thin server-side helper for talking to the Convex HTTP actions (convex/http.ts).
//
// The whole backend is optional: when no Convex URL is configured the app falls
// back to its in-memory SIWB store and self-crawl NFT indexing. `npx convex dev`
// writes NEXT_PUBLIC_CONVEX_SITE_URL automatically; the others are accepted too:
//   NEXT_PUBLIC_CONVEX_SITE_URL  e.g. https://your-deployment.convex.site
//   CONVEX_SITE_URL              (same, non-public)
//   NEXT_PUBLIC_CONVEX_URL       e.g. https://your-deployment.convex.cloud (auto-mapped)

function resolveSiteUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_CONVEX_SITE_URL?.trim() || process.env.CONVEX_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, '');
  const cloud = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  if (cloud) return cloud.replace(/\/$/, '').replace('.convex.cloud', '.convex.site');
  return undefined;
}

const SITE_URL = resolveSiteUrl();

export function convexEnabled(): boolean {
  return Boolean(SITE_URL);
}

/** POST JSON to a Convex HTTP action. Returns parsed JSON or throws. */
export async function convexPost<T = unknown>(path: string, body: unknown): Promise<T> {
  if (!SITE_URL) throw new Error('Convex not configured');
  const res = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Convex ${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** GET JSON from a Convex HTTP action. Returns parsed JSON or throws. */
export async function convexGet<T = unknown>(path: string): Promise<T> {
  if (!SITE_URL) throw new Error('Convex not configured');
  const res = await fetch(`${SITE_URL}${path}`);
  if (!res.ok) throw new Error(`Convex ${path} HTTP ${res.status}`);
  return (await res.json()) as T;
}
