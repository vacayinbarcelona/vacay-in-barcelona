'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LegacyBookingFlow } from './LegacyBookingFlow';
import { ScheduledBookingFlow } from './ScheduledBookingFlow';
import type { BookingAttractionContext, TicketOptionData } from '@/types';

// Shared modal chrome (header, close button, "added to cart" screen) —
// dispatches the actual date/time/ticket picking UI to one of two flows
// depending on whether this product has real Availability schedule data:
//   - ScheduledBookingFlow: language -> date range -> weekday -> time slot
//     (with live remaining capacity) -> per-ticket-type quantities.
//   - LegacyBookingFlow: the original demo-calendar flow, used as a
//     fallback for any product that hasn't had a schedule set up yet.
// Both flows call the same onAdded callback once an item is added to the
// cart, which is all this component needs to know to render a generic
// confirmation screen either way.
type Step = 'select' | 'added';

export function BookingModal({
  attraction,
  ticket,
  onClose
}: {
  attraction: BookingAttractionContext;
  ticket: TicketOptionData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('select');
  const [added, setAdded] = useState<{ title: string; sub: string } | null>(null);

  const hasSchedule = ticket.availabilitySchedules.length > 0;

  function handleAdded(info: { title: string; sub: string }) {
    setAdded(info);
    setStep('added');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-[11px] text-gray-400">{step === 'select' ? 'Choose date & time' : 'Added to cart'}</p>
            <h2 className="text-sm font-semibold">{ticket.name}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2">
            &times;
          </button>
        </div>

        {step === 'select' ? (
          hasSchedule ? (
            <ScheduledBookingFlow attraction={attraction} ticket={ticket} onAdded={handleAdded} />
          ) : (
            <LegacyBookingFlow attraction={attraction} ticket={ticket} onAdded={handleAdded} />
          )
        ) : (
          <div className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4 text-xl">✓</div>
            <p className="text-sm font-semibold mb-1">{added?.title}</p>
            <p className="text-xs text-gray-500 mb-5">{added?.sub}</p>
            <div className="flex items-center justify-center gap-3">
              <button type="button" onClick={onClose} className="border border-gray-300 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-gray-50">
                Keep browsing
              </button>
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-full"
              >
                View cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
