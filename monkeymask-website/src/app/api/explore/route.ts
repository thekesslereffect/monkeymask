import { NextResponse } from 'next/server';
import { convexEnabled, convexGet } from '@/lib/convexClient';

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

export async function GET() {
  if (!convexEnabled()) {
    return NextResponse.json({ featured: [], sites: [] } satisfies ExploreCatalog);
  }
  try {
    const catalog = await convexGet<ExploreCatalog>('/explore');
    return NextResponse.json(catalog, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json({ featured: [], sites: [] } satisfies ExploreCatalog, { status: 502 });
  }
}
