import Image from 'next/image';
import Link from 'next/link';
import { IconCheck, IconClock, IconMobile } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/format';

type Props = {
  attractionSlug: string;
  attractionName: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationLabel: string;
  freeCancellation: boolean;
  mobileTicket: boolean;
  badge: string;
  imageUrl: string;
  imageAlt: string;
};

// One individual bookable product (ticket option) — same visual style as
// the ticket cards on an attraction's own page (TicketGrid), but flattened
// into a cross-attraction grid, so each card carries its parent attraction
// name as a label since the grid mixes products from every attraction.
// Selecting here goes to that attraction's page to actually book — the
// booking modal itself is scoped to a single attraction's context.
export function ProductCard({
  attractionSlug,
  attractionName,
  name,
  description,
  price,
  currency,
  durationLabel,
  freeCancellation,
  mobileTicket,
  badge,
  imageUrl,
  imageAlt
}: Props) {
  const isBestSeller = badge.toLowerCase().includes('best seller');

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col ${
        isBestSeller ? 'border-2 border-blue-600' : 'border border-gray-200'
      }`}
    >
      <Link href={`/attractions/${attractionSlug}`} className="relative h-36 block">
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        />
        {badge ? (
          <span className="absolute top-2.5 left-2.5 bg-white text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
            {badge}
          </span>
        ) : null}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        <Link
          href={`/attractions/${attractionSlug}`}
          className="text-[11px] font-semibold text-blue-600 tracking-wide mb-1 uppercase hover:text-blue-700"
        >
          {attractionName}
        </Link>
        <h3 className="font-semibold text-sm mb-1">{name}</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3">{description}</p>

        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[10px] text-gray-500 mb-4">
          {durationLabel ? (
            <span className="flex items-center gap-1">
              <IconClock className="h-3 w-3" /> {durationLabel}
            </span>
          ) : null}
          {freeCancellation ? (
            <span className="flex items-center gap-1 text-green-600">
              <IconCheck className="h-3 w-3" /> Free cancellation
            </span>
          ) : null}
          {mobileTicket ? (
            <span className="flex items-center gap-1">
              <IconMobile className="h-3 w-3" /> Mobile ticket
            </span>
          ) : null}
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-gray-100">
          <div>
            <div className="text-[10px] text-gray-400">From</div>
            <div className="text-base font-semibold">{formatPrice(price, currency)}</div>
          </div>
          <Link
            href={`/attractions/${attractionSlug}`}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full"
          >
            Select
          </Link>
        </div>
      </div>
    </div>
  );
}
