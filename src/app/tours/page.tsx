import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/db';
import { ProductCard } from '@/components/tours/ProductCard';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export const revalidate = 3600;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('tours');
  return { title, description, alternates: { canonical: '/tours' } };
}

// The full catalog — every published attraction/tour/show's individual
// ticket options, flattened into one grid. /attractions is the curated
// landmark-only subset instead (see src/app/attractions/page.tsx).
async function getAllProducts() {
  const attractions = await prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona' },
    orderBy: { sortOrder: 'asc' },
    include: { ticketOptions: { orderBy: { sortOrder: 'asc' } } }
  });

  return attractions.flatMap((attraction) =>
    attraction.ticketOptions.map((ticket) => ({
      attractionSlug: attraction.slug,
      attractionName: attraction.name,
      name: ticket.name,
      description: ticket.description,
      price: ticket.price,
      currency: ticket.currency,
      durationLabel: ticket.durationLabel,
      freeCancellation: ticket.freeCancellation,
      mobileTicket: ticket.mobileTicket,
      badge: ticket.badge,
      imageUrl: attraction.heroImageUrl,
      imageAlt: attraction.heroImageAlt
    }))
  );
}

export default async function ToursPage() {
  const products = await getAllProducts();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${siteUrl}/attractions/${p.attractionSlug}`,
      name: `${p.attractionName} — ${p.name}`
    }))
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Tours & Tickets', item: `${siteUrl}/tours` }
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
        / <span className="text-gray-600">Tours &amp; tickets</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-semibold mb-2">Tours &amp; tickets in Barcelona</h1>
      <p className="text-gray-500 text-sm max-w-2xl mb-8">
        Every individual ticket, guided tour and combo Vacay in Barcelona offers — compare products across Sagrada
        Família, Park Güell, Casa Batlló, Casa Milà, Camp Nou, guided walking tours and flamenco shows.
      </p>

      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <ProductCard key={`${product.attractionSlug}-${product.name}`} {...product} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No products published yet.</p>
      )}
    </div>
  );
}
