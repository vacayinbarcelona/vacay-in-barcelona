import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { IconCheck, IconClock, IconMobile } from '@/components/ui/Icons';
import { AttractionHero } from '@/components/attraction/AttractionHero';
import { QuickFactsStrip } from '@/components/attraction/QuickFactsStrip';
import { TicketGrid } from '@/components/attraction/TicketGrid';
import { BookingModalProvider } from '@/components/attraction/BookingModalProvider';
import { StickyMobileBar } from '@/components/attraction/StickyMobileBar';
import { Highlights, About, IncludedList, ImportantInfo, ReviewsSection, FaqSection } from '@/components/attraction/InfoSections';
import { RelatedAttractions } from '@/components/attraction/RelatedAttractions';
import { JsonLd } from '@/components/seo/JsonLd';
import type { AttractionCardData, TicketOptionData } from '@/types';

export const revalidate = 3600;

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

async function getAttraction(slug: string) {
  return prisma.attraction.findFirst({
    where: { slug, status: 'published' },
    include: {
      ticketOptions: { orderBy: { sortOrder: 'asc' } },
      highlights: { orderBy: { sortOrder: 'asc' } },
      includedItems: { orderBy: { sortOrder: 'asc' } },
      infoItems: { orderBy: { sortOrder: 'asc' } },
      faqs: { orderBy: { sortOrder: 'asc' } },
      reviews: { orderBy: { sortOrder: 'asc' } },
      images: { orderBy: { sortOrder: 'asc' } },
      quickFacts: { orderBy: { sortOrder: 'asc' } }
    }
  });
}

async function getRelatedAttractions(excludeSlug: string): Promise<AttractionCardData[]> {
  const attractions = await prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona', slug: { not: excludeSlug } },
    orderBy: { sortOrder: 'asc' },
    take: 3
  });
  return attractions;
}

export async function generateStaticParams() {
  const attractions = await prisma.attraction.findMany({ where: { status: 'published' }, select: { slug: true } });
  return attractions.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const attraction = await getAttraction(params.slug);
  if (!attraction) return {};

  const title = attraction.metaTitle || attraction.name;
  const description = attraction.metaDescription || attraction.shortDescription;
  const canonical = `/attractions/${attraction.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: attraction.heroImageUrl ? [{ url: attraction.heroImageUrl, alt: attraction.heroImageAlt }] : undefined
    }
  };
}

export default async function AttractionPage({ params }: { params: { slug: string } }) {
  const attraction = await getAttraction(params.slug);
  if (!attraction) notFound();

  const relatedAttractions = await getRelatedAttractions(attraction.slug);

  // Real photos are limited for some attractions (one hero shot so far) —
  // cycle through whatever gallery images exist so every ticket card still
  // shows a real photo instead of a placeholder.
  const galleryPhotos = attraction.images.length > 0 ? attraction.images : [{ url: attraction.heroImageUrl, altText: attraction.heroImageAlt }];

  const ticketOptions: TicketOptionData[] = attraction.ticketOptions.map((t, i) => {
    const photo = galleryPhotos[i % galleryPhotos.length];
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      price: t.price,
      currency: t.currency,
      durationLabel: t.durationLabel,
      freeCancellation: t.freeCancellation,
      mobileTicket: t.mobileTicket,
      instantConfirmation: t.instantConfirmation,
      languages: t.languages || 'English',
      groupType: t.groupType,
      badge: t.badge,
      imageUrl: photo.url,
      imageAlt: photo.altText || attraction.heroImageAlt
    };
  });

  const defaultTicket = ticketOptions.find((t) => t.badge.toLowerCase().includes('best seller')) ?? ticketOptions[0];

  const bookingContext = {
    slug: attraction.slug,
    name: attraction.name,
    currency: attraction.currency,
    requiresAllTravelerNames: attraction.requiresAllTravelerNames,
    meetingAddress: attraction.address,
    mapUrl: attraction.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.address)}`
  };

  const included = attraction.includedItems.filter((i) => i.included).map((i) => i.text);
  const notIncluded = attraction.includedItems.filter((i) => !i.included).map((i) => i.text);

  const pageUrl = `${siteUrl}/attractions/${attraction.slug}`;

  const touristAttractionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: attraction.name,
    description: attraction.shortDescription,
    url: pageUrl,
    image: attraction.heroImageUrl ? [attraction.heroImageUrl] : undefined,
    address: attraction.address ? { '@type': 'PostalAddress', streetAddress: attraction.address, addressLocality: 'Barcelona' } : undefined,
    aggregateRating:
      attraction.reviewCount > 0
        ? { '@type': 'AggregateRating', ratingValue: attraction.rating, reviewCount: attraction.reviewCount }
        : undefined,
    offers: ticketOptions.map((t) => ({
      '@type': 'Offer',
      name: t.name,
      price: t.price,
      priceCurrency: t.currency,
      availability: 'https://schema.org/InStock',
      url: pageUrl
    }))
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Attractions', item: `${siteUrl}/attractions` },
      { '@type': 'ListItem', position: 3, name: attraction.name, item: pageUrl }
    ]
  };

  const faqJsonLd =
    attraction.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: attraction.faqs.map((f) => ({
            '@type': 'Question',
            name: f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.answer }
          }))
        }
      : null;

  return (
    <BookingModalProvider attraction={bookingContext}>
      <JsonLd data={touristAttractionJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      {faqJsonLd ? <JsonLd data={faqJsonLd} /> : null}

      <AttractionHero
        name={attraction.name}
        tagline={attraction.tagline}
        badgeLabel={attraction.badge ? attraction.badge.toUpperCase() : 'TOP RATED ATTRACTION IN BARCELONA'}
        shortDescription={attraction.shortDescription}
        rating={attraction.rating}
        reviewCount={attraction.reviewCount}
        address={attraction.address}
        breadcrumbLabel={attraction.name}
        images={galleryPhotos}
      />

      <QuickFactsStrip facts={attraction.quickFacts} />

      <div className="max-w-7xl mx-auto px-6 pt-2 pb-24 sm:pb-10">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500 mb-8">
          {attraction.durationLabel ? (
            <span className="flex items-center gap-1">
              <IconClock className="h-3.5 w-3.5" /> {attraction.durationLabel}
            </span>
          ) : null}
          {attraction.freeCancellation ? (
            <span className="flex items-center gap-1 text-green-600">
              <IconCheck className="h-3.5 w-3.5" /> Free cancellation
            </span>
          ) : null}
          {attraction.mobileTicket ? (
            <span className="flex items-center gap-1">
              <IconMobile className="h-3.5 w-3.5" /> Mobile ticket
            </span>
          ) : null}
        </div>

        {ticketOptions.length > 0 ? (
          <section className="bg-blue-50/60 -mx-6 px-6 py-8 mb-2 rounded-2xl">
            <h2 className="text-xl font-semibold mb-1">Select your Ticket and Tour</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-5 max-w-3xl">
              Book {attraction.name} tickets online and skip the ticket office line. Choose from skip-the-line entry
              tickets, guided tours, and combo experiences for {attraction.name} in Barcelona — each with instant
              confirmation, a mobile ticket, and free cancellation on most options up to 24 hours before your visit.
            </p>
            <TicketGrid tickets={ticketOptions} />
          </section>
        ) : null}

        <div className="max-w-3xl">
          <Highlights items={attraction.highlights.map((h) => h.text)} />
          <About longDescription={attraction.longDescription} />
          <IncludedList included={included} notIncluded={notIncluded} />
          <ImportantInfo items={attraction.infoItems.map((i) => i.text)} />
          <ReviewsSection
            rating={attraction.rating}
            reviewCount={attraction.reviewCount}
            reviews={attraction.reviews.map((r) => ({
              authorName: r.authorName,
              authorCountry: r.authorCountry,
              rating: r.rating,
              title: r.title,
              comment: r.comment
            }))}
          />
          <FaqSection faqs={attraction.faqs.map((f) => ({ question: f.question, answer: f.answer }))} />
        </div>
      </div>

      <RelatedAttractions attractions={relatedAttractions} />

      {defaultTicket ? <StickyMobileBar defaultTicket={defaultTicket} /> : null}
    </BookingModalProvider>
  );
}
