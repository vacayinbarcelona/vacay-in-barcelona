'use client';

import Image from 'next/image';
import { useBookingModal } from './BookingModalProvider';
import { IconCheck, IconClock, IconMobile } from '@/components/ui/Icons';
import { formatPrice } from '@/lib/format';
import type { TicketOptionData } from '@/types';

// The premium, photo-rich ticket grid — this is the primary conversion
// surface on the page, so every card carries its own image, badge, and a
// direct "Select" button straight into the booking modal.
export function TicketGrid({ tickets }: { tickets: TicketOptionData[] }) {
  const { open } = useBookingModal();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {tickets.map((ticket) => {
        const isBestSeller = ticket.badge.toLowerCase().includes('best seller');
        return (
          <div
            key={ticket.id}
            className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow flex flex-col ${
              isBestSeller ? 'border-2 border-blue-600' : 'border border-gray-200'
            }`}
          >
            <div className="relative h-40">
              <Image src={ticket.imageUrl} alt={ticket.imageAlt} fill className="object-cover" sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
              {ticket.badge ? (
                <span className="absolute top-2.5 left-2.5 bg-white text-amber-700 text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {ticket.badge}
                </span>
              ) : null}
            </div>

            <div className="p-5 flex flex-col flex-1">
              <h3 className="font-semibold text-sm mb-1">{ticket.name}</h3>
              {ticket.supplierName ? <p className="text-[11px] text-gray-400 mb-1.5">Sold by {ticket.supplierName}</p> : null}
              <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{ticket.description}</p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-500 mb-4">
                {ticket.durationLabel ? (
                  <span className="flex items-center gap-1">
                    <IconClock className="h-3 w-3" /> {ticket.durationLabel}
                  </span>
                ) : null}
                {ticket.freeCancellation ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <IconCheck className="h-3 w-3" /> Free cancellation
                  </span>
                ) : null}
                {ticket.mobileTicket ? (
                  <span className="flex items-center gap-1">
                    <IconMobile className="h-3 w-3" /> Mobile ticket
                  </span>
                ) : null}
              </div>

              <div className="flex items-end justify-between pt-3 border-t border-gray-100">
                <div>
                  <div className="text-[10px] text-gray-400">From</div>
                  <div className="text-base font-semibold">{formatPrice(ticket.price, ticket.currency)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => open(ticket)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-full"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
