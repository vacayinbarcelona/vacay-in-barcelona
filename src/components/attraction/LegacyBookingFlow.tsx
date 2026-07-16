'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  buildMonthGrid,
  getTimeSlotsForDate,
  isDateAvailable,
  MONTH_NAMES,
  WEEKDAY_LABELS,
  type TimeSlot
} from '@/lib/availability';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/components/cart/CartProvider';
import type { BookingAttractionContext, TicketOptionData } from '@/types';

// The original demo-calendar booking flow — used for any product that
// doesn't have real Availability schedule data set up yet (see
// ScheduledBookingFlow for products that do). Picks date, time, language and
// traveler count, then adds it to the cart. Split out of BookingModal.tsx
// unchanged (aside from the addToCart hookup) so BookingModal can dispatch
// to either flow depending on the ticket.
export function LegacyBookingFlow({
  attraction,
  ticket,
  onAdded
}: {
  attraction: BookingAttractionContext;
  ticket: TicketOptionData;
  onAdded: (info: { title: string; sub: string }) => void;
}) {
  const { addItem } = useCart();

  const languageOptions = useMemo(
    () =>
      ticket.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean),
    [ticket.languages]
  );

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [language, setLanguage] = useState(languageOptions[0] ?? 'English');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setLanguage(languageOptions[0] ?? 'English');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id]);

  const slots = selectedDate ? getTimeSlotsForDate(selectedDate, ticket.price) : [];

  const pricePerAdult = selectedSlot?.price ?? ticket.price;
  const pricePerChild = Math.round(pricePerAdult * 0.5);
  const totalPrice = adults * pricePerAdult + children * pricePerChild;

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDate(null);
    setSelectedSlot(null);
  }

  function selectDate(date: Date) {
    if (!isDateAvailable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
  }

  function handleAddToCart() {
    if (!selectedDate || !selectedSlot) return;

    addItem({
      attractionSlug: attraction.slug,
      attractionName: attraction.name,
      imageUrl: ticket.imageUrl,
      imageAlt: ticket.imageAlt,
      requiresAllTravelerNames: attraction.requiresAllTravelerNames,
      ticketOptionId: ticket.id,
      ticketOptionName: ticket.name,
      date: selectedDate.toISOString().slice(0, 10),
      timeSlot: selectedSlot.time,
      language,
      adults,
      children,
      pricePerAdult,
      pricePerChild,
      currency: attraction.currency
    });

    const guestsSummary = `${adults} adult${adults !== 1 ? 's' : ''}${children > 0 ? `, ${children} child${children !== 1 ? 'ren' : ''}` : ''}`;
    onAdded({
      title: 'Added to your cart',
      sub: `${ticket.name} · ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${selectedSlot.time} · ${guestsSummary}`
    });
  }

  const grid = buildMonthGrid(viewYear, viewMonth);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Previous month">
          &larr;
        </button>
        <p className="text-sm font-semibold">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button type="button" onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50" aria-label="Next month">
          &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-gray-400 mb-1">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 mb-5">
        {grid.map((date, i) => {
          if (!date) return <div key={`pad-${i}`} />;
          const available = isDateAvailable(date);
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={!available}
              onClick={() => selectDate(date)}
              className={`h-9 rounded-lg text-xs font-medium ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : available
                    ? 'hover:bg-blue-50 text-gray-700'
                    : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {selectedDate ? (
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 mb-2">Available times</p>
          <div className="grid grid-cols-1 gap-2">
            {slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm ${
                  selectedSlot?.time === slot.time ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">
                  {slot.time}
                  {slot.popular ? <span className="ml-2 text-[10px] text-amber-600 font-semibold">Popular</span> : null}
                </span>
                <span className="text-gray-500 text-xs">{slot.spotsLeft} spots left</span>
                <span className="font-semibold">{formatPrice(slot.price, ticket.currency)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {languageOptions.length > 1 ? (
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {languageOptions.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-medium text-gray-500">Travelers</p>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span>Adults</span>
            <button type="button" onClick={() => setAdults((a) => Math.max(1, a - 1))} className="w-7 h-7 rounded-full border border-gray-300">
              &minus;
            </button>
            <span className="w-4 text-center">{adults}</span>
            <button type="button" onClick={() => setAdults((a) => a + 1)} className="w-7 h-7 rounded-full border border-gray-300">
              +
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span>Children</span>
            <button type="button" onClick={() => setChildren((c) => Math.max(0, c - 1))} className="w-7 h-7 rounded-full border border-gray-300">
              &minus;
            </button>
            <span className="w-4 text-center">{children}</span>
            <button type="button" onClick={() => setChildren((c) => c + 1)} className="w-7 h-7 rounded-full border border-gray-300">
              +
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div>
          <p className="text-[11px] text-gray-400">Total</p>
          <p className="text-lg font-semibold">{formatPrice(totalPrice, ticket.currency)}</p>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedDate || !selectedSlot}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-6 py-2.5 rounded-full"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
