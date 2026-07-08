import Image from 'next/image';
import Link from 'next/link';
import { Rating } from '@/components/ui/Rating';
import { IconCheck, IconClock, IconHeart, IconMobile } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/format';
import type { AttractionCardData } from '@/types';

export function AttractionCard({ attraction }: { attraction: AttractionCardData }) {
  const {
    slug,
    name,
    categoryLabel,
    badge,
    shortDescription,
    heroImageUrl,
    heroImageAlt,
    rating,
    reviewCount,
    priceFrom,
    currency,
    durationLabel,
    freeCancellation,
    mobileTicket
  } = attraction;

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
        <span className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full bg-white/90 flex items-center justify-center">
          <IconHeart className="h-4 w-4 text-gray-500" />
        </span>
      </Link>

      <div className="p-5">
        {categoryLabel ? (
          <p className="text-[11px] font-semibold text-blue-600 tracking-wide mb-1 uppercase">{categoryLabel}</p>
        ) : null}

        <Link href={`/attractions/${slug}`}>
          <h3 className="font-semibold text-base hover:text-blue-700">{name}</h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{shortDescription}</p>

        <div className="mt-3">
          <Rating rating={rating} reviewCount={reviewCount} />
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mt-3">
          {durationLabel ? (
            <div className="flex items-center gap-1">
              <IconClock /> {durationLabel}
            </div>
          ) : null}
          {freeCancellation ? (
            <div className="flex items-center gap-1 text-green-600">
              <IconCheck /> Free cancellation
            </div>
          ) : null}
          {mobileTicket ? (
            <div className="flex items-center gap-1">
              <IconMobile /> Mobile ticket
            </div>
          ) : null}
        </div>

        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-[11px] text-gray-400">From</div>
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
