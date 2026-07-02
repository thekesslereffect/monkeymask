'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@iconify/react';
import type { ExploreSite } from '@/lib/explore';

function SitePreview({ site }: { site: ExploreSite }) {
  const [failed, setFailed] = useState(false);
  const showImage = site.iconUrl && !failed;

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-secondary">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={site.iconUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon icon="lucide:globe" className="size-5 text-muted-foreground" />
      )}
    </div>
  );
}

export function ExploreSitesDirectory() {
  const [featured, setFeatured] = useState<ExploreSite[]>([]);
  const [sites, setSites] = useState<ExploreSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/explore');
        const data = await res.json();
        if (!cancelled) {
          setFeatured(Array.isArray(data.featured) ? data.featured : []);
          setSites(Array.isArray(data.sites) ? data.sites : []);
        }
      } catch {
        if (!cancelled) {
          setFeatured([]);
          setSites([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const site of [...featured, ...sites]) set.add(site.category);
    return Array.from(set);
  }, [featured, sites]);

  const filtered = useMemo(() => {
    if (!selectedCategory) return sites;
    return sites.filter((site) => site.category === selectedCategory);
  }, [sites, selectedCategory]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (featured.length === 0 && sites.length === 0) {
    return (
      <p className="text-center text-sm text-[var(--text-secondary)]">
        Explore catalog is unavailable. Configure Convex to enable the shared ecosystem directory.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {featured.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Featured</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {featured.map((site) => (
              <a
                key={site.slug}
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-3 rounded-xl border border-border bg-white p-4 transition-shadow hover:shadow-md"
              >
                <SitePreview site={site} />
                <div className="min-w-0">
                  <div className="font-semibold group-hover:underline">{site.name}</div>
                  <div className="text-xs font-medium text-[var(--text-secondary)]">{site.category}</div>
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{site.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(active ? null : category)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors ${
                  active ? 'border-border bg-secondary text-[var(--text)]' : 'border-transparent hover:border-border'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((site) => (
          <a
            key={site.slug}
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-border bg-white p-3 transition-shadow hover:shadow-md"
          >
            <SitePreview site={site} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="truncate font-semibold group-hover:underline">{site.name}</div>
                <span className="shrink-0 text-xs font-medium text-[var(--text-secondary)]">
                  {site.category}
                </span>
              </div>
              <p className="truncate text-sm text-[var(--text-secondary)]">{site.description}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
