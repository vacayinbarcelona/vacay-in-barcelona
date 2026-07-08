import Image from 'next/image';
import Link from 'next/link';
import { Rating } from '@/components/ui/Rating';
import { formatPrice } from '@/lib/format';

type Product = { name: string; price: number; currency: string };

type Props = {
  slug: string;
  name: string;
  categoryLabel: string;
  badge: string;
  shortDescription: string;
  heroImageUrl: string;
  heroImageAlt: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  products: Product[];
};

// One row per attraction on /tours — unlike the AttractionCard/TourCard
// grid used elsewhere, this spells out every individual bookable product
// (ticket option) for that attraction, since the point of this page is a
// full catalog rather than a curated highlight.
export function AttractionProductsRow({
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
  products
}: Props) {
  return (
    <div className="group flex flex-col sm:flex-row border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-white">
      <Link href={`/attractions/${slug}`} className="relative sm:w-64 h-48 sm:h-auto flex-shrink-0 overflow-hidden block">
        <Image
          src={heroImageUrl}
          alt={heroImageAlt}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(min-width: 640px) 256px, 100vw"
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
          <h3 className="font-semibold text-lg hover:text-blue-700">{name}</h3>
        </Link>

        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{shortDescription}</p>

        <div className="mt-2">
          <Rating rating={rating} reviewCount={reviewCount} />
        </div>

        {products.length > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-700 mb-1.5">Available products</p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              {products.map((product) => (
                <li key={product.name} className="flex items-start justify-between gap-3">
                  <span className="flex items-start gap-1.5">
                    <span className="text-blue-600 mt-0.5">&bull;</span>
                    {product.name}
                  </span>
                  <span className="font-medium text-gray-700 whitespace-nowrap">{formatPrice(product.price, product.currency)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-[11px] text-gray-400">From</div>
            <div className="text-lg font-semibold">
              {formatPrice(priceFrom, currency)} <span className="text-xs font-normal text-gray-400">/ person</span>
            </div>
          </div>
          <Link
            href={`/attractions/${slug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-full whitespace-nowrap"
          >
            View tickets
          </Link>
        </div>
      </div>
    </div>
  );
}
