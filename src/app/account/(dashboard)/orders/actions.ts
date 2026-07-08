'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/customerAuth';
import { sendOrderCancellationEmail } from '@/lib/email';

const FREE_CANCELLATION_CUTOFF_HOURS = 24;

// Customer-initiated cancellation from /account/orders. Checks the order
// actually belongs to the signed-in customer, records why they're
// cancelling, and works out whether it qualifies under our own
// free-cancellation policy (each booking's attraction must allow free
// cancellation, and the earliest visit date must be more than 24 hours
// away). It does NOT move any money — there's no real Stripe charge
// behind an order yet (checkout still uses placeholder card fields), so
// there's nothing to refund via API. refundEligible just records the
// policy outcome so an admin can process the real refund manually for
// now.
//
// TODO once real payments are wired in: if refundEligible, call the
// Stripe Refunds API here using order.paymentIntentId instead of just
// recording the outcome.
export async function requestCancellation(orderId: string, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/account/sign-in');

  const reason = String(formData.get('reason') ?? '').trim();
  const details = String(formData.get('details') ?? '').trim();

  if (!reason) {
    redirect('/account/orders?error=reason');
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { bookings: { include: { travelers: true } } }
  });

  const belongsToUser = order && (order.userId === user.id || order.email.toLowerCase() === user.email.toLowerCase());
  if (!belongsToUser) {
    redirect('/account/orders?error=notfound');
  }
  if (order.status === 'cancelled') {
    redirect('/account/orders?error=already-cancelled');
  }

  const now = Date.now();
  const cutoffMs = FREE_CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000;

  // Day-level check here (matches the page's canCancel gate) — bookingDate
  // is stored as UTC midnight of the visit date, so comparing it against
  // the exact current instant would incorrectly block same-day visits.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (order.bookings.every((b) => b.bookingDate.getTime() < startOfToday.getTime())) {
    redirect('/account/orders?error=past');
  }

  const attractions = await prisma.attraction.findMany({
    where: { slug: { in: [...new Set(order.bookings.map((b) => b.attractionSlug))] } },
    select: { slug: true, freeCancellation: true }
  });
  const freeCancellationBySlug = new Map(attractions.map((a) => [a.slug, a.freeCancellation]));

  const refundEligible = order.bookings.every(
    (b) => (freeCancellationBySlug.get(b.attractionSlug) ?? false) && b.bookingDate.getTime() - now > cutoffMs
  );

  const cancellationReason = details ? `${reason} — ${details}` : reason;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: 'cancelled', cancellationReason, refundEligible, cancelledAt: new Date() }
    }),
    prisma.booking.updateMany({ where: { orderId: order.id }, data: { status: 'cancelled' } })
  ]);

  try {
    await sendOrderCancellationEmail(order, refundEligible);
  } catch (err) {
    console.error('Order cancelled but cancellation email failed to send:', err);
  }

  revalidatePath('/account/orders');
  redirect(`/account/orders?cancelled=1&refund=${refundEligible ? '1' : '0'}`);
}
