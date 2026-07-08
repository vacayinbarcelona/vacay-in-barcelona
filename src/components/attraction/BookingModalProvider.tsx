'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { BookingModal } from './BookingModal';
import type { BookingAttractionContext, TicketOptionData } from '@/types';

type ModalContextValue = {
  open: (ticket: TicketOptionData) => void;
};

const BookingModalContext = createContext<ModalContextValue | null>(null);

// Any client component under BookingModalProvider (ticket cards, the header
// "Check availability" button, the mobile sticky bar) can call this to open
// the shared checkout modal — that way there's exactly one modal instance
// per page no matter how many buttons can trigger it.
export function useBookingModal(): ModalContextValue {
  const ctx = useContext(BookingModalContext);
  if (!ctx) {
    throw new Error('useBookingModal must be used within a BookingModalProvider');
  }
  return ctx;
}

export function BookingModalProvider({
  attraction,
  children
}: {
  attraction: BookingAttractionContext;
  children: ReactNode;
}) {
  const [activeTicket, setActiveTicket] = useState<TicketOptionData | null>(null);

  function open(ticket: TicketOptionData) {
    setActiveTicket(ticket);
  }

  function close() {
    setActiveTicket(null);
  }

  return (
    <BookingModalContext.Provider value={{ open }}>
      {children}
      {activeTicket ? <BookingModal attraction={attraction} ticket={activeTicket} onClose={close} /> : null}
    </BookingModalContext.Provider>
  );
}
