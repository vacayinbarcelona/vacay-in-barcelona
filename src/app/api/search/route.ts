import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Lightweight typeahead for the homepage hero search bar. Matches on name
// only (case-insensitive contains) — good enough for a catalogue this size;
// swap for a proper search index if the attraction count grows a lot.
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });

  const results = await prisma.attraction.findMany({
    where: {
      status: 'published',
      name: { contains: q, mode: 'insensitive' }
    },
    select: { slug: true, name: true, categoryLabel: true, heroImageUrl: true, heroImageAlt: true },
    orderBy: { sortOrder: 'asc' },
    take: 6
  });

  return NextResponse.json({ results });
}
