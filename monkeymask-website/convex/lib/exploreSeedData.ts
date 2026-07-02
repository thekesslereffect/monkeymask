import seed from './exploreSeed.json';

export interface ExploreSeedEntry {
  name: string;
  description: string;
  url: string;
  category: string;
  featured?: boolean;
}

export const EXPLORE_FEATURED_SEED: ExploreSeedEntry[] = seed.featured;
export const EXPLORE_SITES_SEED: ExploreSeedEntry[] = seed.sites;
