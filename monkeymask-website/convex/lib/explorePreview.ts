/** Helpers for resolving a site preview/icon URL from a page URL. */

export function faviconFallback(pageUrl: string): string {
  try {
    const host = new URL(pageUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  } catch {
    return '';
  }
}

export function resolveAbsoluteUrl(base: string, href: string): string | undefined {
  try {
    return new URL(href.trim(), base).href;
  } catch {
    return undefined;
  }
}

/** Best-effort preview from HTML: og:image, twitter:image, then touch/icon link. */
export function extractPreviewFromHtml(html: string, pageUrl: string): string | undefined {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
    /<link[^>]+rel=["'](?:apple-touch-icon(?:-precomposed)?|icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:apple-touch-icon(?:-precomposed)?|icon|shortcut icon)["']/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const resolved = resolveAbsoluteUrl(pageUrl, match[1]);
      if (resolved) return resolved;
    }
  }
  return undefined;
}

export function slugFromSite(name: string, category: string): string {
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  return `${slugify(name)}-${slugify(category)}`;
}
