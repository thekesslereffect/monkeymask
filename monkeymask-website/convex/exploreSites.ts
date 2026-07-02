import { v } from 'convex/values';
import {
  query,
  internalQuery,
  internalMutation,
  internalAction,
} from './_generated/server';
import { internal } from './_generated/api';
import type { MutationCtx } from './_generated/server';
import {
  EXPLORE_FEATURED_SEED,
  EXPLORE_SITES_SEED,
  type ExploreSeedEntry,
} from './lib/exploreSeedData';
import { faviconFallback, slugFromSite } from './lib/explorePreview';

const publicSiteValidator = v.object({
  slug: v.string(),
  name: v.string(),
  description: v.string(),
  url: v.string(),
  category: v.string(),
  featured: v.boolean(),
  sortOrder: v.number(),
  featuredSortOrder: v.optional(v.number()),
  iconUrl: v.optional(v.string()),
});

function toPublicSite(doc: {
  slug: string;
  name: string;
  description: string;
  url: string;
  category: string;
  featured: boolean;
  sortOrder: number;
  featuredSortOrder?: number;
  iconUrl?: string;
}) {
  return {
    slug: doc.slug,
    name: doc.name,
    description: doc.description,
    url: doc.url,
    category: doc.category,
    featured: doc.featured,
    sortOrder: doc.sortOrder,
    featuredSortOrder: doc.featuredSortOrder,
    iconUrl: doc.iconUrl,
  };
}

/** Public catalog for the extension + website explore pages. */
export const list = query({
  args: {},
  returns: v.object({
    featured: v.array(publicSiteValidator),
    sites: v.array(publicSiteValidator),
  }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('exploreSites')
      .withIndex('by_enabled', (q) => q.eq('enabled', true))
      .collect();

    const featured = rows
      .filter((row) => row.featured)
      .sort(
        (a, b) =>
          (a.featuredSortOrder ?? a.sortOrder) - (b.featuredSortOrder ?? b.sortOrder),
      )
      .map(toPublicSite);

    const sites = rows
      .filter((row) => !row.featured)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(toPublicSite);

    return { featured, sites };
  },
});

export const listAllForRefresh = internalQuery({
  args: {},
  returns: v.array(
    v.object({
      slug: v.string(),
      url: v.string(),
      iconUrl: v.optional(v.string()),
    }),
  ),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query('exploreSites')
      .withIndex('by_enabled', (q) => q.eq('enabled', true))
      .collect();
    return rows.map((row) => ({
      slug: row.slug,
      url: row.url,
      iconUrl: row.iconUrl,
    }));
  },
});

async function upsertSeedEntry(
  ctx: MutationCtx,
  entry: ExploreSeedEntry,
  opts: { featured: boolean; sortOrder: number; featuredSortOrder?: number },
) {
  const slug = slugFromSite(entry.name, entry.category);
  const existing = await ctx.db
    .query('exploreSites')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique();

  const now = Date.now();
  const iconUrl = faviconFallback(entry.url);
  const payload = {
    slug,
    name: entry.name,
    description: entry.description,
    url: entry.url,
    category: entry.category,
    featured: opts.featured,
    sortOrder: opts.sortOrder,
    featuredSortOrder: opts.featuredSortOrder,
    iconUrl: iconUrl || undefined,
    enabled: true,
    updatedAt: now,
  };

  if (existing) {
    await ctx.db.patch(existing._id, payload);
    return existing._id;
  }
  return await ctx.db.insert('exploreSites', payload);
}

/** Idempotent seed from the checked-in catalog (run via Convex CLI or lazy HTTP bootstrap). */
export const seedFromData = internalMutation({
  args: {},
  returns: v.object({ insertedOrUpdated: v.number() }),
  handler: async (ctx) => {
    let count = 0;
    for (let i = 0; i < EXPLORE_SITES_SEED.length; i++) {
      await upsertSeedEntry(ctx, EXPLORE_SITES_SEED[i], {
        featured: false,
        sortOrder: i * 10,
      });
      count++;
    }
    for (let i = 0; i < EXPLORE_FEATURED_SEED.length; i++) {
      await upsertSeedEntry(ctx, EXPLORE_FEATURED_SEED[i], {
        featured: true,
        sortOrder: i,
        featuredSortOrder: i,
      });
      count++;
    }
    await ctx.scheduler.runAfter(0, internal.exploreSites.refreshAllIcons, {});
    return { insertedOrUpdated: count };
  },
});

export const setSiteIcon = internalMutation({
  args: {
    slug: v.string(),
    iconUrl: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const row = await ctx.db
      .query('exploreSites')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!row) return null;
    await ctx.db.patch(row._id, { iconUrl: args.iconUrl, updatedAt: Date.now() });
    return null;
  },
});

export const refreshAllIcons = internalAction({
  args: {},
  returns: v.object({ refreshed: v.number() }),
  handler: async (ctx) => {
    const catalog = await ctx.runQuery(internal.exploreSites.listAllForRefresh, {});
    let refreshed = 0;
    for (const site of catalog) {
      const iconUrl = await ctx.runAction(internal.exploreSitesActions.fetchSiteIcon, {
        url: site.url,
        fallback: site.iconUrl ?? faviconFallback(site.url),
      });
      if (iconUrl) {
        await ctx.runMutation(internal.exploreSites.setSiteIcon, {
          slug: site.slug,
          iconUrl,
        });
        refreshed++;
      }
    }
    return { refreshed };
  },
});
