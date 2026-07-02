'use node';

import { v } from 'convex/values';
import { internalAction } from './_generated/server';
import { extractPreviewFromHtml, faviconFallback } from './lib/explorePreview';

const FETCH_TIMEOUT_MS = 12_000;

/** Fetch og:image / favicon from a live page; fall back to Google favicons. */
export const fetchSiteIcon = internalAction({
  args: {
    url: v.string(),
    fallback: v.optional(v.string()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (_ctx, args) => {
    const fallback = args.fallback ?? faviconFallback(args.url);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const response = await fetch(args.url, {
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
            'User-Agent': 'MonkeyMaskExploreBot/1.0 (+https://monkeymask.io)',
          },
        });
        if (!response.ok) return fallback || null;
        const contentType = response.headers.get('content-type') ?? '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
          return fallback || null;
        }
        const html = await response.text();
        const preview = extractPreviewFromHtml(html.slice(0, 200_000), response.url || args.url);
        return preview ?? fallback ?? null;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return fallback || null;
    }
  },
});
