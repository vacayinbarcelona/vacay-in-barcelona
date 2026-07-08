import Image from 'next/image';
import Link from 'next/link';
import { Rating } from '@/components/ui/Rating';
import { formatPrice } from '@/lib/format';
import type { TourCardData } from '@/types';

export function TourCard({ tour }: { tour: TourCardData }) {
  const { slug, name, categoryLabel, badge, shortDescription, heroImageUrl, heroImageAlt, rating, reviewCount, priceFrom, currency, highlightBullets } = tour;

  return (
    <div className="group flex flex-col sm:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
      <Link href={`/attractions/${slug}`} className="relative sm:w-56 h-44 sm:h-56 flex-shrink-0 overflow-hidden block">
        <Image
          src={heroImageUrl}
          alt={heroImageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(min-width: 640px) 224px, 100vw"
        />
        {badge ? (
          <span className="absolute top-2.5 left-2.5 bg-white text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="p-5 flex-1 flex flex-col">
        {categoryLabel ? (
          <p className="text-[11px] font-semibold text-blue-600 tracking-wide mb-1 uppercase">{categoryLabel}</p>
        ) : null}

        <Link href={`/attractions/${slug}`}>
          <h3 className="font-semibold text-base hover:text-blue-700">{name}</h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{shortDescription}</p>

        {highlightBullets.length > 0 ? (
          <ul className="text-xs text-gray-500 mt-3 space-y-1">
            {highlightBullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-1.5">
                <span className="text-blue-600">&bull;</span>
                {bullet}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="mb-1">
              <Rating rating={rating} reviewCount={reviewCount} />
            </div>
            <div className="text-lg font-semibold">
              {formatPrice(priceFrom, currency)} <span className="text-xs font-normal text-gray-400">/ person</span>
            </div>
          </div>
          <Link
            href={`/attractions/${slug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-full"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}
