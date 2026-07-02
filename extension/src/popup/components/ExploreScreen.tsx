import React, { useEffect, useMemo, useState } from 'react';
import { Header, Card, ContentContainer, Footer, PageName, Button, Carousel } from './ui';
import { Icon } from '@iconify/react';
import type { ExploreSite } from '../../utils/explore';

function SitePreview({ site, size = 'md' }: { site: ExploreSite; size?: 'md' | 'lg' }) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'lg' ? 'size-14' : 'size-12';
  const showImage = site.iconUrl && !failed;

  return (
    <div
      className={`${dim} shrink-0 overflow-hidden rounded-xl border border-tertiary/10 bg-tertiary/10 flex items-center justify-center`}
    >
      {showImage ? (
        <img
          src={site.iconUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <Icon icon="lucide:globe" className={`${size === 'lg' ? 'text-2xl' : 'text-xl'} text-tertiary/60`} />
      )}
    </div>
  );
}

export const ExploreScreen: React.FC = () => {
  const [featuredSites, setFeaturedSites] = useState<ExploreSite[]>([]);
  const [sites, setSites] = useState<ExploreSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_EXPLORE' });
        if (cancelled) return;
        if (response?.success) {
          setFeaturedSites(response.data.featured ?? []);
          setSites(response.data.sites ?? []);
        } else {
          setError(response?.error || 'Failed to load explore catalog');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load explore catalog');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    sites.forEach((s) => set.add(s.category));
    featuredSites.forEach((s) => set.add(s.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [sites, featuredSites]);

  const filteredSites = useMemo(() => {
    if (!selectedCategory) return sites;
    return sites.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, sites]);

  const toggleCategory = (category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category));
  };

  const handleVisitSite = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden font-semibold">
      <Header active={true} />

      <ContentContainer>
        <PageName name="Explore" back={true} />

        <div className="w-full space-y-4">
          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-tertiary/10 animate-pulse" />
              ))}
            </div>
          )}

          {!loading && error && (
            <Card>
              <div className="p-3 text-sm text-destructive">{error}</div>
            </Card>
          )}

          {!loading && !error && (
            <>
              {featuredSites.length > 0 && (
                <div className="space-y-3">
                  <div className="text-tertiary font-semibold">Featured</div>
                  <Carousel autoPlay intervalMs={3000} holdIntervalMs={5000}>
                    {featuredSites.map((site) => (
                      <Card key={site.slug} className="w-full">
                        <div className="flex w-full gap-3 p-2">
                          <SitePreview site={site} size="lg" />
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-lg font-semibold text-primary truncate">{site.name}</div>
                                <div className="text-xs font-semibold text-tertiary/70">
                                  {site.category}
                                </div>
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleVisitSite(site.url)}
                                className="!w-auto shrink-0"
                              >
                                Visit Site
                              </Button>
                            </div>
                            <div className="mt-2 text-sm text-tertiary/80 leading-relaxed">{site.description}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Carousel>
                </div>
              )}

              {allCategories.length > 0 && (
                <div className="flex w-full flex-wrap gap-2">
                  {allCategories.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <Button
                        key={category}
                        variant={active ? 'secondary' : 'ghost'}
                        size="sm"
                        className={`max-w-full shrink-0 grow basis-auto !w-auto whitespace-nowrap ${
                          active ? 'border border-tertiary/30' : ''
                        }`}
                        onClick={() => toggleCategory(category)}
                        aria-pressed={active}
                      >
                        {category}
                      </Button>
                    );
                  })}
                </div>
              )}

              <div className="space-y-1">
                <div className="text-tertiary font-semibold text-2xl">Sites</div>
                <div className="grid grid-cols-1 gap-2">
                  {filteredSites.map((site) => (
                    <Card key={site.slug} hover={true} onClick={() => handleVisitSite(site.url)}>
                      <div className="flex items-center gap-3 p-2">
                        <SitePreview site={site} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-primary truncate">{site.name}</div>
                            <div className="text-xs font-semibold shrink-0 text-tertiary/70">
                              {site.category}
                            </div>
                          </div>
                          <div className="text-sm text-tertiary/70 truncate">{site.description}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </ContentContainer>

      <Footer />
    </div>
  );
};
