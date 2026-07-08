'use server';

import { prisma } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

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

    // TODO before launch: verify availability (and reserve each slot) via
    // the Rezdy API here, and confirm payment succeeded (e.g. Stripe
    // PaymentIntent) before writing the order. Right now this trusts the
    // values passed in from the cart.

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
          create: input.items.map((item) => ({
            attractionSlug: item.attractionSlug,
            attractionName: item.attractionName,
            ticketOptionName: item.ticketOptionName,
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
          }))
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
