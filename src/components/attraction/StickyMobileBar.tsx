'use client';

import { useBookingModal } from './BookingModalProvider';
import { formatPrice } from '@/lib/format';
import type { TicketOptionData } from '@/types';

export function StickyMobileBar({ defaultTicket }: { defaultTicket: TicketOptionData }) {
  const { open } = useBookingModal();
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between sm:hidden">
      <div>
        <div className="text-[10px] text-gray-400">From</div>
        <div className="text-base font-semibold">{formatPrice(defaultTicket.price, defaultTicket.currency)}</div>
      </div>
      <button type="button" onClick={() => open(defaultTicket)} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full">
        Check availability
      </button>
    </div>
  );
}
