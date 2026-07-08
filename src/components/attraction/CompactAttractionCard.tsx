import Image from 'next/image';
import Link from 'next/link';
import { Rating } from '@/components/ui/Rating';
import { formatPrice } from '@/lib/format';
import type { AttractionCardData } from '@/types';

// A stripped-down card for "Explore more" style sections — just what's
// needed to get someone to click through: photo, title, rating, price, and
// a book button. The full AttractionCard (with description, duration,
// cancellation info, etc.) is used on the homepage; this one is
// intentionally lighter since it's a secondary, browse-more surface.
export function CompactAttractionCard({ attraction }: { attraction: AttractionCardData }) {
  const { slug, name, heroImageUrl, heroImageAlt, rating, reviewCount, priceFrom, currency } = attraction;

  return (
    <div className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow bg-white">
      <Link href={`/attractions/${slug}`} className="block relative h-36 overflow-hidden">
        <Image
          src={heroImageUrl}
          alt={heroImageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(min-width: 1024px) 33vw, 100vw"
        />
      </Link>

      <div className="p-4">
        <Link href={`/attractions/${slug}`}>
          <h3 className="text-sm font-medium hover:text-blue-700 line-clamp-1">{name}</h3>
        </Link>

        <div className="mt-1.5">
          <Rating rating={rating} reviewCount={reviewCount} />
        </div>

        <div className="flex items-end justify-between mt-3 pt-3 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400">From</div>
            <div className="text-sm font-semibold">{formatPrice(priceFrom, currency)}</div>
          </div>
          <Link
            href={`/attractions/${slug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-4 py-2 rounded-full"
          >
            Book now
          </Link>
        </div>
      </div>
    </div>
  );
}
