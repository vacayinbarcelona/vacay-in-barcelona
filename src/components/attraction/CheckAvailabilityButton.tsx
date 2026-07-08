'use client';

import { useBookingModal } from './BookingModalProvider';
import type { TicketOptionData } from '@/types';

export function CheckAvailabilityButton({
  defaultTicket,
  className,
  label = 'Check availability'
}: {
  defaultTicket: TicketOptionData;
  className?: string;
  label?: string;
}) {
  const { open } = useBookingModal();
  return (
    <button type="button" onClick={() => open(defaultTicket)} className={className}>
      {label}
    </button>
  );
}
