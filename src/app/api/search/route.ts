import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { fuzzySearch } from '@/lib/search';

// Typeahead for the homepage hero search bar. Fuzzy-matched (see
// src/lib/search.ts) rather than a strict SQL `contains` — ignores accents
// ("guell" -> "Güell"), punctuation, and tolerates small typos. The
// catalogue is small enough to fetch every published attraction and rank
// matches in memory; swap for a proper search index if that stops being
// true.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const attractions = await prisma.attraction.findMany({
    where: { status: 'published' },
    select: { slug: true, name: true, categoryLabel: true, heroImageUrl: true, heroImageAlt: true },
    orderBy: { sortOrder: 'asc' }
  });

  const results = fuzzySearch(attractions, q, (a) => a.name, 6);

  return NextResponse.json({ results });
}
