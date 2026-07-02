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