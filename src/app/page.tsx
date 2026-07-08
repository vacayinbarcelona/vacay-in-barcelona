import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { Hero } from '@/components/home/Hero';
import { FeatureStrip } from '@/components/home/FeatureStrip';
import { CategoryPills } from '@/components/home/CategoryPills';
import { AttractionCard } from '@/components/home/AttractionCard';
import { TourCard } from '@/components/home/TourCard';
import { SeoGuideAndFaq } from '@/components/home/SeoGuideAndFaq';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSeoMetadataFor } from '@/lib/siteSettings';
import type { AttractionCardData, TourCardData } from '@/types';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

// Revalidate every hour so homepage listings stay fresh without hitting the
// database on every request. Adjust or remove once traffic patterns are known.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('home');
  // `absolute` bypasses the root layout's "%s | Vacay in Barcelona" title
  // template, so whatever's set in /admin/seo shows exactly as typed.
  return { title: { absolute: title }, description };
}

async function getFeaturedAttractions(): Promise<AttractionCardData[]> {
  const attractions = await prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona', featured: true },
    orderBy: { sortOrder: 'asc' }
  });
  return attractions;
}

async function getPopularTours(): Promise<TourCardData[]> {
  const tours = await prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona', popularTour: true },
    orderBy: { sortOrder: 'asc' },
    include: { highlights: { orderBy: { sortOrder: 'asc' }, take: 2 } }
  });

  return tours.map((tour) => ({
    ...tour,
    highlightBullets: tour.highlights.map((h) => h.text)
  }));
}

export default async function HomePage() {
  const [attractions, tours] = await Promise.all([getFeaturedAttractions(), getPopularTours()]);

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

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <Hero />
      <FeatureStrip />
      <CategoryPills />

      <section id="attractions" className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Popular Barcelona attractions</h2>
            <p className="text-gray-500 text-sm mt-1">
              Skip-the-line tickets and guided tours for the city&apos;s landmark sights
            </p>
          </div>
          <Link href="/attractions" className="text-blue-600 text-sm font-medium whitespace-nowrap">
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {attractions.map((attraction) => (
            <AttractionCard key={attraction.slug} attraction={attraction} />
          ))}

          <Link
            href="/attractions"
            className="hidden lg:flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-300"
          >
            <p className="text-sm font-medium text-gray-700 mb-1">See all Barcelona attractions</p>
            <p className="text-xs text-gray-500 mb-4">Compare every ticket and tour in one place</p>
            <span className="text-sm font-medium text-blue-600 border border-blue-200 rounded-full px-5 py-2">
              View all &rarr;
            </span>
          </Link>
        </div>
      </section>

      <section id="tours" className="max-w-7xl mx-auto px-6 pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold">Popular tours &amp; experiences</h2>
            <p className="text-gray-500 text-sm mt-1">Guided walks, food and live shows around the city</p>
          </div>
          <Link href="/tours" className="text-blue-600 text-sm font-medium whitespace-nowrap">
            View all &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {tours.map((tour) => (
            <TourCard key={tour.slug} tour={tour} />
          ))}
        </div>
      </section>

      <SeoGuideAndFaq />
    </>
  );
}
