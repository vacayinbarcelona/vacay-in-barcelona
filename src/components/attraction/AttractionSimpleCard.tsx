import Image from 'next/image';
import Link from 'next/link';
import type { AttractionCardData } from '@/types';

// Stripped-down card for /attractions — just the attraction, its photo, a
// short description, and a Book now button. No price, rating, or icon
// row — those stay on the homepage's fuller AttractionCard.
export function AttractionSimpleCard({ attraction }: { attraction: AttractionCardData }) {
  const { slug, name, categoryLabel, badge, shortDescription, heroImageUrl, heroImageAlt } = attraction;

  return (
    <div className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
      <Link href={`/attractions/${slug}`} className="block relative h-52 overflow-hidden">
        <Image
          src={heroImageUrl}
          alt={heroImageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        {badge ? (
          <span className="absolute top-2.5 left-2.5 bg-white text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="p-5">
        {categoryLabel ? (
          <p className="text-[11px] font-semibold text-blue-600 tracking-wide mb-1 uppercase">{categoryLabel}</p>
        ) : null}

        <Link href={`/attractions/${slug}`}>
          <h3 className="font-semibold text-base hover:text-blue-700">{name}</h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{shortDescription}</p>

        <Link
          href={`/attractions/${slug}`}
          className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-full"
        >
          Book now
        </Link>
      </div>
    </div>
  );
}
