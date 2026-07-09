import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { AttractionSimpleCard } from '@/components/attraction/AttractionSimpleCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSeoMetadataFor } from '@/lib/siteSettings';
import { fuzzySearch } from '@/lib/search';
import type { AttractionCardData } from '@/types';

export const revalidate = 3600;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('attractions');
  return { title, description, alternates: { canonical: '/attractions' } };
}

// Landmark-only listing — Sagrada Família, Park Güell, Casa Batlló, Casa
// Milà, Camp Nou. Guided walking tours and shows have their own category
// and live on /tours instead (see src/app/tours/page.tsx).
// When a search term is present (from the homepage hero search bar), it
// matches across every category — not just landmarks — since a visitor who
// searched isn't necessarily looking for a landmark specifically.
async function getAttractions(q?: string): Promise<AttractionCardData[]> {
  if (q) {
    // Fuzzy-matched (see src/lib/search.ts) rather than a strict SQL
    // `contains` — ignores accents ("guell" -> "Güell"), punctuation, and
    // tolerates small typos, same as the homepage hero search bar.
    const attractions = await prisma.attraction.findMany({
      where: { status: 'published', city: 'Barcelona' },
      orderBy: { sortOrder: 'asc' }
    });
    return fuzzySearch(attractions, q, (a) => a.name);
  }

  return prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona', category: 'attraction' },
    orderBy: { sortOrder: 'asc' }
  });
}

export default async function AttractionsPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = searchParams?.q?.trim() || '';
  const attractions = await getAttractions(q || undefined);

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: attractions.map((a, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/attractions/${a.slug}`,
      name: a.name
    }))
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Attractions', item: `${siteUrl}/attractions` }
    ]
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav className="text-xs text-gray-400 mb-4">
        <Link href="/" className="hover:text-gray-600">
          Home
        </Link>{' '}
        / <span className="text-gray-600">Attractions</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">
        {q ? `Search results for "${q}"` : 'Attractions in Barcelona'}
      </h1>
      <p className="text-gray-500 text-sm max-w-2xl mb-8">
        {q
          ? `${attractions.length} result${attractions.length === 1 ? '' : 's'} matching your search.`
          : "Skip-the-line tickets for the city's most iconic landmarks — Sagrada Família, Park Güell, Casa Batlló, Casa Milà, Camp Nou and more. Compare options and book in minutes, with free cancellation on most tickets."}
      </p>

      {attractions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((attraction) => (
            <AttractionSimpleCard key={attraction.slug} attraction={attraction} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {q ? 'No attractions or tours matched your search.' : 'No attractions published yet.'}
        </p>
      )}
    </div>
  );
}
