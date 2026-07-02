export interface ExploreSite {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  featured: boolean;
  sortOrder: number;
  featuredSortOrder?: number;
  iconUrl?: string;
}

export interface ExploreCatalog {
  featured: ExploreSite[];
  sites: ExploreSite[];
}

const BUILD_CONVEX_URL = (process.env.MONKEYMASK_CONVEX_URL || '').replace(/\/$/, '');

let resolvedConvexUrl: string | undefined;

async function resolveConvexSiteUrl(): Promise<string> {
  if (resolvedConvexUrl !== undefined) return resolvedConvexUrl;
  try {
    const stored = await chrome.storage.local.get(['convexSiteUrl']);
    const fromStorage =
      typeof stored.convexSiteUrl === 'string' ? stored.convexSiteUrl.trim().replace(/\/$/, '') : '';
    if (fromStorage) {
      resolvedConvexUrl = fromStorage;
      return resolvedConvexUrl;
    }
  } catch {
    // Non-extension contexts fall through.
  }
  resolvedConvexUrl = BUILD_CONVEX_URL;
  return resolvedConvexUrl;
}

/** Fetch the curated explore catalog from Convex. Never throws. */
export async function fetchExploreCatalog(): Promise<ExploreCatalog> {
  const siteUrl = await resolveConvexSiteUrl();
  if (!siteUrl) return { featured: [], sites: [] };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    try {
      const response = await fetch(`${siteUrl}/explore`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return { featured: [], sites: [] };
      const payload = (await response.json()) as ExploreCatalog;
      return {
        featured: Array.isArray(payload.featured) ? payload.featured : [],
        sites: Array.isArray(payload.sites) ? payload.sites : [],
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return { featured: [], sites: [] };
  }
}