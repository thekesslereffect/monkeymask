import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api, internal } from './_generated/api';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

const preflight = httpAction(async () => new Response(null, { status: 204, headers: CORS_HEADERS }));

const http = httpRouter();

// NFT ownership is read crawler-free directly from the ledger by clients
// (see the website's src/lib/nft.ts and the extension's utils/nft.ts), so this
// backend intentionally exposes no NFT index route.

// --- Explore directory ---
// GET /explore -> { featured: ExploreSite[], sites: ExploreSite[] }
http.route({
  path: '/explore',
  method: 'GET',
  handler: httpAction(async (ctx) => {
    let catalog = await ctx.runQuery(api.exploreSites.list, {});
    if (catalog.featured.length === 0 && catalog.sites.length === 0) {
      await ctx.runMutation(internal.exploreSites.seedFromData, {});
      catalog = await ctx.runQuery(api.exploreSites.list, {});
    }
    return json(catalog, 200, { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' });
  }),
});
http.route({ path: '/explore', method: 'OPTIONS', handler: preflight });

// --- SIWB durable storage ---
http.route({
  path: '/siwb/issueNonce',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { nonce, domain, expiresAt } = await request.json();
    if (typeof nonce !== 'string' || typeof domain !== 'string' || typeof expiresAt !== 'number') {
      return json({ error: 'Invalid payload' }, 400);
    }
    await ctx.runMutation(internal.siwb.issueNonce, { nonce, domain, expiresAt });
    return json({ ok: true });
  }),
});
http.route({ path: '/siwb/issueNonce', method: 'OPTIONS', handler: preflight });

http.route({
  path: '/siwb/consumeNonce',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { nonce } = await request.json();
    if (typeof nonce !== 'string') return json({ domain: null });
    const domain = await ctx.runMutation(internal.siwb.consumeNonce, { nonce, now: Date.now() });
    return json({ domain });
  }),
});
http.route({ path: '/siwb/consumeNonce', method: 'OPTIONS', handler: preflight });

http.route({
  path: '/siwb/createSession',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { token, address, expiresAt } = await request.json();
    if (typeof token !== 'string' || typeof address !== 'string' || typeof expiresAt !== 'number') {
      return json({ error: 'Invalid payload' }, 400);
    }
    await ctx.runMutation(internal.siwb.createSession, { token, address, expiresAt });
    return json({ ok: true });
  }),
});
http.route({ path: '/siwb/createSession', method: 'OPTIONS', handler: preflight });

http.route({
  path: '/siwb/getSession',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { token } = await request.json();
    if (typeof token !== 'string') return json({ address: null });
    const address = await ctx.runQuery(internal.siwb.getSession, { token, now: Date.now() });
    return json({ address });
  }),
});
http.route({ path: '/siwb/getSession', method: 'OPTIONS', handler: preflight });

http.route({
  path: '/siwb/deleteSession',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const { token } = await request.json();
    if (typeof token === 'string') {
      await ctx.runMutation(internal.siwb.deleteSession, { token });
    }
    return json({ ok: true });
  }),
});
http.route({ path: '/siwb/deleteSession', method: 'OPTIONS', handler: preflight });

export default http;
