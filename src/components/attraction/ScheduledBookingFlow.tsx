'use client';

import { useEffect, useMemo, useState } from 'react';
import { buildMonthGrid, isPastDate, MONTH_NAMES, WEEKDAY_LABELS, toDateKey } from '@/lib/availability';
import { weekdayFromDateString, type SlotDraft } from '@/lib/availabilitySchedule';
import { getScheduleBookedQuantities } from '@/lib/scheduleAvailabilityActions';
import { formatPrice, formatTime12h } from '@/lib/format';
import { useCart } from '@/components/cart/CartProvider';
import type { BookingAttractionContext, TicketOptionData, TicketBreakdownEntry } from '@/types';

function formatAgeRange(ageFromValue: number, ageFromUnit: string, ageToValue: number, ageToUnit: string): string {
  const unitLabel = (v: number, u: string) => (u === 'months' ? `${v} mo` : `${v} yr`);
  return `${unitLabel(ageFromValue, ageFromUnit)} – ${unitLabel(ageToValue, ageToUnit)}`;
}

// Booking flow for a product with real Availability schedule data (see
// availabilitySchedule.ts) — language, then a calendar constrained to that
// language's date range and bookable weekdays, then a time slot showing
// live remaining capacity, then a quantity per ticket type sharing that
// slot's single inventory pool. See LegacyBookingFlow for the fallback used
// on products without schedule data.
export function ScheduledBookingFlow({
  attraction,
  ticket,
  onAdded
}: {
  attraction: BookingAttractionContext;
  ticket: TicketOptionData;
  onAdded: (info: { title: string; sub: string }) => void;
}) {
  const { addItem } = useCart();
  const schedules = ticket.availabilitySchedules;

  const [language, setLanguage] = useState(schedules[0]?.language ?? '');
  const activeSchedule = useMemo(() => schedules.find((s) => s.language === language) ?? schedules[0], [schedules, language]);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotDraft | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [bookedMap, setBookedMap] = useState<Record<string, number>>({});
  const [loadingBooked, setLoadingBooked] = useState(true);

  // Reload booked quantities whenever a different ticket option's modal
  // opens — one fetch covers every date/slot for this product, so date/slot
  // clicks afterward don't need their own round trip.
  useEffect(() => {
    let cancelled = false;
    setLoadingBooked(true);
    getScheduleBookedQuantities(ticket.id)
      .then((map) => {
        if (!cancelled) setBookedMap(map);
      })
      .finally(() => {
        if (!cancelled) setLoadingBooked(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticket.id]);

  // Reset the picker whenever the shopper switches ticket or language —
  // start the calendar on whichever is later: today, or the schedule's own
  // start date (so a schedule starting months out doesn't open on a
  // grayed-out current month).
  useEffect(() => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setQuantities({});
    const [dfy, dfm] = (activeSchedule?.dateFrom ?? '').split('-').map(Number);
    const now = new Date();
    if (dfy && dfm && dfy * 12 + (dfm - 1) > now.getFullYear() * 12 + now.getMonth()) {
      setViewYear(dfy);
      setViewMonth(dfm - 1);
    } else {
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket.id, activeSchedule?.id]);

  if (!activeSchedule) {
    return <div className="p-5 text-sm text-gray-500">This product has no availability configured yet.</div>;
  }

  function isDateBookable(date: Date): boolean {
    if (isPastDate(date)) return false;
    const key = toDateKey(date);
    if (key < activeSchedule!.dateFrom || key > activeSchedule!.dateTo) return false;
    const weekday = weekdayFromDateString(key);
    return activeSchedule!.slots.some((sl) => sl.weekday === weekday);
  }

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
    setQuantities({});
  }

  function selectDate(date: Date) {
    if (!isDateBookable(date)) return;
    setSelectedDate(date);
    setSelectedSlot(null);
    setQuantities({});
  }

  function selectSlot(slot: SlotDraft) {
    setSelectedSlot(slot);
    setQuantities({});
  }

  const dateKey = selectedDate ? toDateKey(selectedDate) : null;
  const weekdayOfSelected = dateKey ? weekdayFromDateString(dateKey) : null;
  const slotsForDay = weekdayOfSelected ? activeSchedule.slots.filter((sl) => sl.weekday === weekdayOfSelected) : [];

  function remainingForSlot(slot: SlotDraft): number {
    if (!dateKey) return slot.availability;
    const booked = bookedMap[`${dateKey}|${slot.time}`] ?? 0;
    return Math.max(0, slot.availability - booked);
  }

  const remaining = selectedSlot ? remainingForSlot(selectedSlot) : 0;
  const totalQty = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalPrice = selectedSlot
    ? selectedSlot.ticketTypes.reduce((sum, t) => sum + (quantities[t.id] ?? 0) * t.price, 0)
    : 0;

  function setQty(ticketTypeId: string, qty: number) {
    const clamped = Math.max(0, qty);
    const othersTotal = totalQty - (quantities[ticketTypeId] ?? 0);
    const capped = Math.min(clamped, Math.max(0, remaining - othersTotal));
    setQuantities((prev) => ({ ...prev, [ticketTypeId]: capped }));
  }

  function handleAddToCart() {
    if (!selectedDate || !selectedSlot || totalQty === 0) return;

    const breakdown: TicketBreakdownEntry[] = selectedSlot.ticketTypes
      .filter((t) => (quantities[t.id] ?? 0) > 0)
      .map((t) => ({
        name: t.name,
        quantity: quantities[t.id],
        price: t.price,
        ageFromValue: t.ageFromValue,
        ageFromUnit: t.ageFromUnit,
        ageToValue: t.ageToValue,
        ageToUnit: t.ageToUnit
      }));

    addItem({
      attractionSlug: attraction.slug,
      attractionName: attraction.name,
      imageUrl: ticket.imageUrl,
      imageAlt: ticket.imageAlt,
      requiresAllTravelerNames: attraction.requiresAllTravelerNames,
      ticketOptionId: ticket.id,
      ticketOptionName: ticket.name,
      date: dateKey!,
      timeSlot: selectedSlot.time,
      language: activeSchedule.language,
      adults: totalQty,
      children: 0,
      pricePerAdult: totalPrice / totalQty,
      pricePerChild: 0,
      currency: attraction.currency,
      ticketBreakdown: breakdown
    });

    const breakdownSummary = breakdown.map((b) => `${b.name} ×${b.quantity}`).join(', ');
    onAdded({
      title: 'Added to your cart',
      sub: `${ticket.name} · ${selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${formatTime12h(selectedSlot.time)} · ${breakdownSummary}`
    });
  }

  const grid = buildMonthGrid(viewYear, viewMonth);

  return (
    <div className="p-5">
      {schedules.length > 1 ? (
        <div className="mb-5">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Language</label>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {schedules.map((s) => (
              <option key={s.id} value={s.language}>
                {s.language}
              </option>
            ))}
          </select>
        </div>
      ) : null}

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
          const available = isDateBookable(date);
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
          {loadingBooked ? (
            <p className="text-xs text-gray-400">Checking availability…</p>
          ) : slotsForDay.length === 0 ? (
            <p className="text-xs text-gray-400">No time slots on this day.</p>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {slotsForDay.map((slot) => {
                const left = remainingForSlot(slot);
                const soldOut = left <= 0;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => selectSlot(slot)}
                    className={`flex items-center justify-between border rounded-lg px-3 py-2.5 text-sm ${
                      soldOut
                        ? 'border-gray-100 text-gray-300 cursor-not-allowed'
                        : selectedSlot?.id === slot.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium">{formatTime12h(slot.time)}</span>
                    <span className={`text-xs ${soldOut ? 'text-red-400' : 'text-gray-500'}`}>
                      {soldOut ? 'Sold out' : `${left} spot${left !== 1 ? 's' : ''} left`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {selectedSlot ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">Tickets</p>
            <p className="text-[11px] text-gray-400">{Math.max(0, remaining - totalQty)} of {remaining} left</p>
          </div>
          <div className="space-y-2">
            {selectedSlot.ticketTypes.map((t) => {
              const qty = quantities[t.id] ?? 0;
              return (
                <div key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {formatAgeRange(t.ageFromValue, t.ageFromUnit, t.ageToValue, t.ageToUnit)} · {formatPrice(t.price, ticket.currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => setQty(t.id, qty - 1)} className="w-7 h-7 rounded-full border border-gray-300" disabled={qty === 0}>
                      &minus;
                    </button>
                    <span className="w-4 text-center text-sm">{qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(t.id, qty + 1)}
                      className="w-7 h-7 rounded-full border border-gray-300"
                      disabled={totalQty >= remaining}
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
        <div>
          <p className="text-[11px] text-gray-400">Total</p>
          <p className="text-lg font-semibold">{formatPrice(totalPrice, ticket.currency)}</p>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!selectedDate || !selectedSlot || totalQty === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-6 py-2.5 rounded-full"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
