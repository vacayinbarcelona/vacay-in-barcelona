'use server';

import { prisma } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

// Creates an Order (one payment, one confirmation) containing one or more
// Bookings — the cart's contents at checkout time. This is the handoff
// point /checkout calls once guest details are filled in. It does NOT yet:
//   - check real-time availability or reserve slots with Rezdy
//   - capture a real payment (e.g. via Stripe)
// Both need to be added before this goes live — see the TODOs below. Until
// then, treat any order created here as a demo record, not a real
// reservation or charge.

export type CheckoutTravelerInput = {
  firstName: string;
  lastName: string;
  type: 'adult' | 'child';
};

export type CheckoutItemInput = {
  attractionSlug: string;
  attractionName: string;
  ticketOptionId: string;
  ticketOptionName: string;
  bookingDate: string; // ISO date string, e.g. "2026-08-14"
  timeSlot: string;
  language: string;
  adults: number;
  children: number;
  pricePerAdult: number;
  pricePerChild: number;
  currency: string;
  travelers: CheckoutTravelerInput[]; // empty when this item's attraction only needs a lead name
};

export type CreateOrderInput = {
  items: CheckoutItemInput[];
  leadFirstName: string;
  leadLastName: string;
  email: string;
  phone: string;
  userId?: string | null; // set when a signed-in customer is checking out
  captchaToken: string | null;
};

export type CreateOrderResult = { success: true; reference: string } | { success: false; error: string };

function generateOrderReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O/1/I
  let code = 'VIB-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  try {
    if (input.items.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }
    if (!input.email || !input.leadFirstName || !input.leadLastName) {
      return { success: false, error: 'Missing required guest details.' };
    }

    // Best-effort per-IP throttle, on top of CAPTCHA below — checkout is the
    // one action on the site that can send a real "your booking is
    // confirmed" email to an arbitrary address, so it gets both layers.
    if (isRateLimited(`checkout:${getClientIp()}`, 8, 10 * 60_000)) {
      return { success: false, error: "You've placed a few orders in a short time — please wait a few minutes and try again." };
    }

    // Signed-in customers skip the captcha — an authenticated session is
    // already a strong bot deterrent (same reasoning as skipping it for
    // "Continue with Google" elsewhere). Guest checkout is the actual risk
    // surface, since anyone can type any email address into it.
    if (!input.userId && !(await verifyRecaptcha(input.captchaToken))) {
      return { success: false, error: 'Please complete the captcha and try again.' };
    }

    // TODO before launch: verify availability (and reserve each slot) via
    // the Rezdy API here, and confirm payment succeeded (e.g. Stripe
    // PaymentIntent) before writing the order. Right now this trusts the
    // values passed in from the cart.

    // Snapshot each item's product-specific details (meeting point,
    // included/not included, before you go) from its TicketOption onto the
    // Booking at the moment of purchase — deliberately frozen so that later
    // edits to the product (or a future Rezdy re-sync) don't retroactively
    // change what a past customer's confirmation shows. Looked up in one
    // batched query rather than once per item.
    const ticketOptionIds = Array.from(new Set(input.items.map((i) => i.ticketOptionId).filter(Boolean)));
    const ticketOptions = ticketOptionIds.length
      ? await prisma.ticketOption.findMany({
          where: { id: { in: ticketOptionIds } },
          include: { includedItems: { orderBy: { sortOrder: 'asc' } }, infoItems: { orderBy: { sortOrder: 'asc' } } }
        })
      : [];
    const ticketOptionById = new Map(ticketOptions.map((t) => [t.id, t]));

    const currency = input.items[0]?.currency ?? 'EUR';
    const totalPrice = input.items.reduce((sum, item) => sum + item.adults * item.pricePerAdult + item.children * item.pricePerChild, 0);

    let reference = generateOrderReference();
    // Extremely unlikely, but guard against a reference collision.
    while (await prisma.order.findUnique({ where: { reference } })) {
      reference = generateOrderReference();
    }

    const order = await prisma.order.create({
      data: {
        reference,
        userId: input.userId ?? null,
        email: input.email,
        leadFirstName: input.leadFirstName,
        leadLastName: input.leadLastName,
        phone: input.phone,
        totalPrice,
        currency,
        status: 'confirmed',
        bookings: {
          create: input.items.map((item) => {
            const ticketOption = ticketOptionById.get(item.ticketOptionId);
            return {
              attractionSlug: item.attractionSlug,
              attractionName: item.attractionName,
              ticketOptionId: item.ticketOptionId,
              ticketOptionName: item.ticketOptionName,
              meetingPoint: ticketOption?.meetingPoint ?? '',
              includedSnapshot: (ticketOption?.includedItems.filter((i) => i.included).map((i) => i.text) ?? []).join('\n'),
              notIncludedSnapshot: (ticketOption?.includedItems.filter((i) => !i.included).map((i) => i.text) ?? []).join('\n'),
              beforeYouGoSnapshot: (ticketOption?.infoItems.map((i) => i.text) ?? []).join('\n'),
              bookingDate: new Date(item.bookingDate),
              timeSlot: item.timeSlot,
              language: item.language,
              adults: item.adults,
              children: item.children,
              pricePerAdult: item.pricePerAdult,
              pricePerChild: item.pricePerChild,
              totalPrice: item.adults * item.pricePerAdult + item.children * item.pricePerChild,
              currency: item.currency,
              status: 'confirmed',
              travelers: {
                create: item.travelers.map((t, i) => ({
                  firstName: t.firstName,
                  lastName: t.lastName,
                  type: t.type,
                  sortOrder: i
                }))
              }
            };
          })
        }
      },
      include: { bookings: { include: { travelers: true } } }
    });

    try {
      await sendOrderConfirmationEmail(order);
      await prisma.order.update({ where: { id: order.id }, data: { confirmationEmailSentAt: new Date() } });
    } catch (emailError) {
      // Don't fail the whole order if the email fails to send — the order
      // itself is more important. Log it so it can be retried or the
      // customer followed up with manually.
      console.error('Order created but confirmation email failed to send:', emailError);
    }

    return { success: true, reference: order.reference };
  } catch (error) {
    console.error('createOrder failed:', error);
    return { success: false, error: 'Something went wrong creating your order. Please try again.' };
  }
}
