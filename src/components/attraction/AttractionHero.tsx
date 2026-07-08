import Link from 'next/link';
import Image from 'next/image';
import { IconStar, IconPin, IconAward, IconTag, IconShield, IconHeadset } from '@/components/ui/Icons';

const TRUST_ITEMS = [
  { icon: IconAward, label: 'Top Rated Attraction' },
  { icon: IconTag, label: 'Official Tickets' },
  { icon: IconShield, label: 'Secure Booking' },
  { icon: IconHeadset, label: '24/7 Support' }
];

type GalleryImage = { url: string; altText: string };

export function AttractionHero({
  name,
  tagline,
  badgeLabel,
  shortDescription,
  rating,
  reviewCount,
  address,
  breadcrumbLabel,
  images
}: {
  name: string;
  tagline: string;
  badgeLabel: string;
  shortDescription: string;
  rating: number;
  reviewCount: number;
  address: string;
  breadcrumbLabel: string;
  images: GalleryImage[];
}) {
  const main = images[0];
  const side = images.slice(1, 3);

  return (
    <section className="relative bg-white">
      <div className="max-w-7xl mx-auto lg:grid lg:grid-cols-[minmax(0,560px)_1fr]">
        {/* Text column */}
        <div className="relative z-10 flex flex-col justify-center px-6 pt-6 pb-10 lg:py-14">
          <nav className="text-xs text-gray-500 mb-6">
            <Link href="/" className="text-blue-600 hover:text-blue-700">
              Home
            </Link>{' '}
            &gt;{' '}
            <Link href="/attractions" className="hover:text-gray-700">
              Attractions
            </Link>{' '}
            &gt; <span className="text-gray-700">{breadcrumbLabel}</span>
          </nav>

          <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-medium text-gray-800 mb-5">
            <IconStar className="h-3.5 w-3.5 text-amber-500" />
            {badgeLabel}
          </span>

          <h1 className="text-gray-900 text-4xl sm:text-5xl font-semibold leading-[1.05]">{name}</h1>

          {tagline ? (
            <p className="mt-2">
              <span className="italic text-blue-600 text-2xl sm:text-3xl font-medium border-b-2 border-amber-400 pb-1">
                {tagline}
              </span>
            </p>
          ) : null}

          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mt-5 max-w-md">{shortDescription}</p>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-5 text-sm">
            <span className="flex items-center gap-1 font-semibold text-gray-900">
              <IconStar className="h-4 w-4 text-amber-500" /> {rating.toFixed(1)}
            </span>
            <span className="text-gray-400">({reviewCount.toLocaleString()} reviews)</span>
            {address ? (
              <>
                <span className="text-gray-300 mx-1">|</span>
                <span className="flex items-center gap-1 text-gray-500">
                  <IconPin className="h-4 w-4 flex-shrink-0" /> {address}
                </span>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-4 mt-7">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center text-center w-16">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-800 mb-1.5">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-gray-600 text-[11px] leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photo column */}
        {main ? (
          <div className="relative hidden lg:block min-h-[620px]">
            <Image src={main.url} alt={main.altText} fill priority className="object-cover" sizes="60vw" />
            <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white to-transparent" />

            {side.length > 0 ? (
              <div className="absolute right-8 top-10 flex flex-col gap-3 w-[280px]">
                {side[0] ? (
                  <div className="relative h-40 rounded-xl overflow-hidden border-4 border-white shadow-xl">
                    <Image src={side[0].url} alt={side[0].altText} fill className="object-cover" sizes="280px" />
                  </div>
                ) : null}
                {side[1] ? (
                  <div className="flex gap-3">
                    <div className="relative h-28 w-1/2 rounded-xl overflow-hidden border-4 border-white shadow-xl">
                      <Image src={side[1].url} alt={side[1].altText} fill className="object-cover" sizes="140px" />
                    </div>
                    <div className="relative h-28 w-1/2 rounded-xl overflow-hidden border-4 border-white shadow-xl">
                      <Image src={main.url} alt={main.altText} fill className="object-cover" sizes="140px" />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Compact image for mobile, where the side-by-side layout is hidden */}
        {main ? (
          <div className="relative lg:hidden mx-6 mb-6 h-56 rounded-2xl overflow-hidden">
            <Image src={main.url} alt={main.altText} fill className="object-cover" sizes="100vw" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
