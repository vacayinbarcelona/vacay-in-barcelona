'use server';

import { prisma } from '@/lib/db';

// Real-time remaining-inventory support for the Availability schedule
// feature (see availabilitySchedule.ts) — inventory is shared across all
// ticket types at the *slot* level (see TicketOptionScheduleSlot.availability
// in the schema), so "remaining" for a given departure = that slot's total
// capacity minus every non-cancelled traveler already booked against that
// exact ticketOptionId + date + time. Called both by the public booking
// modal (ScheduledBookingFlow — to grey out full departures/cap quantity
// pickers) and by checkout (createOrder — to re-validate before writing the
// order), so the two can never drift out of sync.
export async function getScheduleBookedQuantities(ticketOptionId: string): Promise<Record<string, number>> {
  if (!ticketOptionId) return {};

  const rows = await prisma.booking.groupBy({
    by: ['bookingDate', 'timeSlot'],
    where: { ticketOptionId, status: { not: 'cancelled' } },
    _sum: { adults: true, children: true }
  });

  const map: Record<string, number> = {};
  for (const row of rows) {
    const dateKey = row.bookingDate.toISOString().slice(0, 10);
    const key = `${dateKey}|${row.timeSlot}`;
    map[key] = (row._sum.adults ?? 0) + (row._sum.children ?? 0);
  }
  return map;
}
