import { Resend } from 'resend';
import type { Order, Booking, BookingTraveler } from '@prisma/client';
import { formatDate, formatPrice } from '@/lib/format';

// Sends the order confirmation email via Resend (https://resend.com).
// Requires RESEND_API_KEY and EMAIL_FROM in .env — see .env.example.
//
// An Order can contain several Bookings (different attractions/dates added
// to the cart before paying once), so the email lists every line item, not
// just one ticket. This is called right after checkout — see
// src/app/checkout/actions.ts.

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file (see .env.example) to send real emails.');
  }
  return new Resend(apiKey);
}

export type BookingWithTravelers = Booking & { travelers: BookingTraveler[] };
export type OrderWithBookings = Order & { bookings: BookingWithTravelers[] };

export async function sendOrderConfirmationEmail(order: OrderWithBookings): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set. Add it to your .env file (see .env.example).');
  }

  const resend = getResendClient();
  const itemLabel = order.bookings.length === 1 ? order.bookings[0].attractionName : `${order.bookings.length} experiences`;

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Your booking is confirmed — ${itemLabel} (${order.reference})`,
    html: orderConfirmationEmailHtml(order)
  });
}

function bookingSectionHtml(booking: BookingWithTravelers): string {
  const travelerRows =
    booking.travelers.length > 0
      ? booking.travelers
          .map(
            (t) =>
              `<tr><td style="padding:3px 0;color:#4b5563;">${t.type === 'child' ? 'Child' : 'Adult'}</td><td style="padding:3px 0;">${escapeHtml(t.firstName)} ${escapeHtml(t.lastName)}</td></tr>`
          )
          .join('')
      : '';

  return `
    <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:12px;padding:16px;font-size:14px;margin-bottom:16px;">
      <tbody>
        <tr><td style="padding:4px 0;color:#4b5563;">Ticket</td><td style="padding:4px 0;font-weight:600;">${escapeHtml(booking.ticketOptionName)}</td></tr>
        <tr><td style="padding:4px 0;color:#4b5563;">Attraction</td><td style="padding:4px 0;">${escapeHtml(booking.attractionName)}</td></tr>
        <tr><td style="padding:4px 0;color:#4b5563;">Date &amp; time</td><td style="padding:4px 0;">${formatDate(booking.bookingDate)} at ${escapeHtml(booking.timeSlot)}</td></tr>
        ${booking.language ? `<tr><td style="padding:4px 0;color:#4b5563;">Language</td><td style="padding:4px 0;">${escapeHtml(booking.language)}</td></tr>` : ''}
        <tr><td style="padding:4px 0;color:#4b5563;">Guests</td><td style="padding:4px 0;">${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}</td></tr>
        <tr><td style="padding:4px 0;color:#4b5563;">Price</td><td style="padding:4px 0;font-weight:600;">${formatPrice(booking.totalPrice, booking.currency)}</td></tr>
        ${travelerRows ? `<tr><td colspan="2" style="padding-top:8px;"><table style="width:100%;border-collapse:collapse;">${travelerRows}</table></td></tr>` : ''}
      </tbody>
    </table>`;
}

export function orderConfirmationEmailHtml(order: OrderWithBookings): string {
  const bookingSections = order.bookings.map(bookingSectionHtml).join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
    <p style="font-size:13px;color:#2563eb;font-weight:600;letter-spacing:.02em;margin:0 0 4px;">VACAY IN BARCELONA</p>
    <h1 style="font-size:20px;margin:0 0 4px;">Booking confirmed, ${escapeHtml(order.leadFirstName)}!</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Order reference ${escapeHtml(order.reference)}</p>

    ${bookingSections}

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:8px;">
      <tbody>
        <tr><td style="padding:4px 0;color:#4b5563;">Total paid</td><td style="padding:4px 0;font-weight:700;text-align:right;">${formatPrice(order.totalPrice, order.currency)}</td></tr>
      </tbody>
    </table>

    <h2 style="font-size:15px;margin:24px 0 8px;">Before you go</h2>
    <ul style="font-size:13px;color:#4b5563;padding-left:18px;margin:0;">
      <li>Show this email or your mobile ticket at entry</li>
      <li>Arrive 15–30 minutes before each time slot</li>
      <li>Bring ID matching the traveler name(s) on each booking</li>
    </ul>

    <p style="font-size:12px;color:#9ca3af;margin-top:32px;line-height:1.6;">
      Vacay in Barcelona is an independent ticket and tour marketplace and is not affiliated with, endorsed by,
      or the official website of any attraction listed. Questions about this order? Reply to this email or visit
      our contact page.
    </p>
  </div>`;
}

// Sent when a customer cancels a booking themselves from /account/orders.
// refundEligible reflects our own free-cancellation policy check (see
// requestCancellation in src/app/account/(dashboard)/orders/actions.ts) —
// it does NOT mean a refund has actually been issued yet, since real
// payment processing (Stripe) isn't wired in. For now this just sets
// expectations; an admin follows up to process the real refund.
export async function sendOrderCancellationEmail(order: OrderWithBookings, refundEligible: boolean): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set. Add it to your .env file (see .env.example).');
  }

  const resend = getResendClient();

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Your booking has been cancelled — ${order.reference}`,
    html: orderCancellationEmailHtml(order, refundEligible)
  });
}

function orderCancellationEmailHtml(order: OrderWithBookings, refundEligible: boolean): string {
  const bookingSections = order.bookings.map(bookingSectionHtml).join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111827;">
    <p style="font-size:13px;color:#2563eb;font-weight:600;letter-spacing:.02em;margin:0 0 4px;">VACAY IN BARCELONA</p>
    <h1 style="font-size:20px;margin:0 0 4px;">Booking cancelled, ${escapeHtml(order.leadFirstName)}</h1>
    <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Order reference ${escapeHtml(order.reference)}</p>

    <p style="font-size:14px;color:#374151;margin:0 0 20px;">
      ${
        refundEligible
          ? "This booking qualified for free cancellation, and we're processing your refund — it should appear on your original payment method within a few business days."
          : "This booking was outside our free-cancellation window, so it wasn't automatically eligible for a refund. If you'd like to discuss this, reply to this email or contact us."
      }
    </p>

    ${bookingSections}

    <p style="font-size:12px;color:#9ca3af;margin-top:32px;line-height:1.6;">
      Vacay in Barcelona is an independent ticket and tour marketplace and is not affiliated with, endorsed by,
      or the official website of any attraction listed. Questions about this cancellation? Reply to this email or
      visit our contact page.
    </p>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
