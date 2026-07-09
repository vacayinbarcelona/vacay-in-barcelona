import { Resend } from 'resend';
import type { Order, Booking, BookingTraveler, Attraction, AttractionImage } from '@prisma/client';
import { prisma } from '@/lib/db';
import { formatDateShort, formatPrice, formatTime12h } from '@/lib/format';

// Sends transactional emails via Resend (https://resend.com). Requires
// RESEND_API_KEY and EMAIL_FROM in .env — see .env.example.
//
// The booking confirmation / cancellation emails are deliberately built to
// look like a condensed version of the /booking-confirmation/[reference]
// page (same QR code, thumbnail, meeting-point photo, included/not-included
// layout) rather than a plain text summary — see bookingCardHtml below.
// Email clients don't run Tailwind or support flexbox/grid reliably, so
// everything here is table-based with inline styles on purpose.

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set. Add it to your .env file (see .env.example) to send real emails.');
  }
  return new Resend(apiKey);
}

export type BookingWithTravelers = Booking & { travelers: BookingTraveler[] };
export type OrderWithBookings = Order & { bookings: BookingWithTravelers[] };
type AttractionWithImages = Attraction & { images: AttractionImage[] };

// Booking only stores attractionSlug/attractionName (frozen at checkout) —
// the photos, address, and map link live on Attraction, so we look those up
// once per email send, the same way the confirmation page does.
async function getAttractionsBySlug(bookings: BookingWithTravelers[]): Promise<Map<string, AttractionWithImages>> {
  const slugs = Array.from(new Set(bookings.map((b) => b.attractionSlug)));
  if (slugs.length === 0) return new Map();
  const attractions = await prisma.attraction.findMany({
    where: { slug: { in: slugs } },
    include: { images: { orderBy: { sortOrder: 'asc' } } }
  });
  return new Map(attractions.map((a) => [a.slug, a]));
}

export async function sendOrderConfirmationEmail(order: OrderWithBookings): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set. Add it to your .env file (see .env.example).');
  }

  const resend = getResendClient();
  const attractionBySlug = await getAttractionsBySlug(order.bookings);
  const itemLabel = order.bookings.length === 1 ? order.bookings[0].attractionName : `${order.bookings.length} experiences`;

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Your booking is confirmed — ${itemLabel} (${order.reference})`,
    html: orderConfirmationEmailHtml(order, attractionBySlug)
  });
}

// Email clients load images over the open internet, not relative to any
// page — so an image saved as a local path (e.g.
// "/images/attractions/sagrada/meeting-point.jpg") needs the site's domain
// prepended before it'll render in an inbox. Full https:// URLs pass through
// unchanged.
function toAbsoluteImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  return `${siteUrl}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Renders a checklist as a table (not <ul>/<li>) so the marker column lines
// up consistently across email clients, with its own color independent of
// the text — e.g. green checks for "included", muted crosses for "not
// included".
function bulletListHtml(items: string[], textColor = '#374151', marker = '&bull;', markerColor = '#9ca3af'): string {
  if (items.length === 0) return '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${items
    .map(
      (text) =>
        `<tr><td valign="top" style="padding:2px 6px 2px 0;font-size:13px;line-height:1.5;color:${markerColor};width:14px;">${marker}</td><td style="padding:2px 0;font-size:13px;line-height:1.5;color:${textColor};">${escapeHtml(text)}</td></tr>`
    )
    .join('')}</table>`;
}

function sectionDivider(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px;padding-top:16px;border-top:1px solid #f3f4f6;"><tr><td>${inner}</td></tr></table>`;
}

function labelHtml(text: string): string {
  return `<p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.03em;">${escapeHtml(text)}</p>`;
}

// One card per line item in the order — mirrors the per-booking section on
// the confirmation page: QR code, thumbnail, date/guests/language, meeting
// point (with photo), included/not included, and before-you-go. Meeting
// point / included / not-included / before-you-go are all frozen onto the
// Booking at checkout time (see createOrder in src/app/checkout/actions.ts),
// so this always reflects exactly what the customer was told when they
// booked this specific ticket, regardless of later product edits.
function bookingCardHtml(booking: BookingWithTravelers, attraction: AttractionWithImages | undefined, isCancelled: boolean): string {
  const thumbnail = toAbsoluteImageUrl(attraction?.images[0]?.url ?? attraction?.heroImageUrl);
  const meetingPoint = booking.meetingPoint || attraction?.address || '';
  const mapUrl =
    attraction?.mapUrl || (meetingPoint ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPoint)}` : '');
  const included = booking.includedSnapshot.split('\n').filter(Boolean);
  const notIncluded = booking.notIncludedSnapshot.split('\n').filter(Boolean);
  const beforeYouGo = booking.beforeYouGoSnapshot.split('\n').filter(Boolean);
  const guestsLabel = `${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${
    booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''
  }`;
  const qrData = encodeURIComponent(`${booking.id} | ${booking.attractionName} | ${formatDateShort(booking.bookingDate)} ${formatTime12h(booking.timeSlot)}`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrData}`;

  const qrOrBadge = isCancelled
    ? `<div style="width:72px;height:72px;border-radius:10px;background:#fef2f2;border:1px solid #fecaca;text-align:center;"><p style="margin:0;line-height:72px;font-size:10px;color:#dc2626;">Cancelled</p></div>`
    : `<img src="${qrCodeUrl}" alt="Ticket QR code" width="72" height="72" style="display:block;border-radius:8px;border:1px solid #e5e7eb;" />`;

  const travelersHtml =
    booking.travelers.length > 0
      ? sectionDivider(`
          ${labelHtml('Travelers')}
          <p style="margin:0;font-size:13px;color:#374151;">${booking.travelers
            .map((t) => `${escapeHtml(t.firstName)} ${escapeHtml(t.lastName)}`)
            .join(' &bull; ')}</p>
        `)
      : '';

  const meetingPointHtml = meetingPoint
    ? sectionDivider(`
        ${labelHtml('Meeting point')}
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            ${
              booking.meetingPointImage
                ? `<td width="72" valign="top" style="padding-right:12px;"><img src="${escapeHtml(toAbsoluteImageUrl(booking.meetingPointImage))}" alt="" width="72" height="72" style="display:block;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;" /></td>`
                : ''
            }
            <td valign="top">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#374151;white-space:pre-line;">${escapeHtml(meetingPoint)}</p>
              ${mapUrl ? `<a href="${escapeHtml(mapUrl)}" style="font-size:13px;color:#2563eb;font-weight:600;text-decoration:none;">Open in Google Maps &rarr;</a>` : ''}
            </td>
          </tr>
        </table>
      `)
    : '';

  const inclusionsHtml =
    included.length > 0 || notIncluded.length > 0
      ? sectionDivider(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              ${
                included.length > 0
                  ? `<td valign="top" width="50%" style="padding-right:10px;">${labelHtml("What's included")}${bulletListHtml(included, '#374151', '&#10003;', '#16a34a')}</td>`
                  : '<td valign="top" width="50%"></td>'
              }
              ${
                notIncluded.length > 0
                  ? `<td valign="top" width="50%" style="padding-left:10px;">${labelHtml('Not included')}${bulletListHtml(notIncluded, '#9ca3af', '&#10005;', '#d1d5db')}</td>`
                  : '<td valign="top" width="50%"></td>'
              }
            </tr>
          </table>
        `)
      : '';

  const beforeYouGoHtml = beforeYouGo.length > 0 ? sectionDivider(`${labelHtml('Before you go')}${bulletListHtml(beforeYouGo)}`) : '';

  const cancellationNoteHtml =
    attraction?.freeCancellation && !isCancelled
      ? sectionDivider(`<p style="margin:0;font-size:11px;color:#9ca3af;">Free cancellation up to 24 hours before the experience</p>`)
      : '';

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid ${isCancelled ? '#fecaca' : '#e5e7eb'};border-radius:14px;margin:0 0 20px;">
    <tr>
      <td style="padding:20px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td width="72" valign="top" style="padding-right:14px;">${qrOrBadge}</td>
            <td valign="top">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                <tr>
                  ${thumbnail ? `<td width="52" valign="top" style="padding-right:12px;"><img src="${thumbnail}" alt="" width="52" height="52" style="display:block;border-radius:10px;object-fit:cover;" /></td>` : ''}
                  <td valign="top">
                    <p style="margin:0;font-size:14px;font-weight:600;color:#111827;">${escapeHtml(booking.attractionName)}</p>
                    <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${escapeHtml(booking.ticketOptionName)}</p>
                  </td>
                  <td valign="top" align="right" style="white-space:nowrap;padding-left:8px;">
                    <p style="margin:0;font-size:10px;color:#9ca3af;">${isCancelled ? 'Amount' : 'Total paid'}</p>
                    <p style="margin:2px 0 0;font-size:14px;font-weight:700;color:#111827;">${formatPrice(booking.totalPrice, booking.currency)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        ${sectionDivider(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td valign="top">
                <p style="margin:0;font-size:10px;color:#9ca3af;">Date &amp; time</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#111827;">${formatDateShort(booking.bookingDate)} &middot; ${formatTime12h(booking.timeSlot)}</p>
              </td>
              <td valign="top" style="padding-left:16px;">
                <p style="margin:0;font-size:10px;color:#9ca3af;">Guests</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#111827;">${guestsLabel}</p>
              </td>
              <td valign="top" style="padding-left:16px;">
                <p style="margin:0;font-size:10px;color:#9ca3af;">Language</p>
                <p style="margin:2px 0 0;font-size:13px;font-weight:600;color:#111827;">${escapeHtml(booking.language || '—')}</p>
              </td>
            </tr>
          </table>
        `)}
        ${travelersHtml}
        ${meetingPointHtml}
        ${inclusionsHtml}
        ${cancellationNoteHtml}
        ${beforeYouGoHtml}
      </td>
    </tr>
  </table>`;
}

function brandHeaderHtml(): string {
  return `<p style="margin:0 0 20px;font-size:13px;color:#2563eb;font-weight:700;letter-spacing:.04em;">VACAY IN BARCELONA</p>`;
}

function footerHtml(): string {
  return `
    <p style="font-size:12px;color:#9ca3af;margin-top:28px;line-height:1.6;">
      Vacay in Barcelona is an independent ticket and tour marketplace and is not affiliated with, endorsed by,
      or the official website of any attraction listed. Questions about this order? Reply to this email or visit
      our <a href="${(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')}/contact-us" style="color:#9ca3af;">contact page</a>.
    </p>`;
}

export function orderConfirmationEmailHtml(order: OrderWithBookings, attractionBySlug: Map<string, AttractionWithImages>): string {
  const primaryBooking = order.bookings[0];
  const primaryAttraction = primaryBooking ? attractionBySlug.get(primaryBooking.attractionSlug) : undefined;
  const heroPhoto = toAbsoluteImageUrl(primaryAttraction?.images[0]?.url ?? primaryAttraction?.heroImageUrl);

  const bookingSections = order.bookings.map((b) => bookingCardHtml(b, attractionBySlug.get(b.attractionSlug), false)).join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;background:#ffffff;">
    ${brandHeaderHtml()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border:1px solid #f3f4f6;border-radius:16px;margin-bottom:24px;overflow:hidden;">
      ${heroPhoto ? `<tr><td><img src="${heroPhoto}" alt="" width="600" style="display:block;width:100%;max-height:220px;object-fit:cover;" /></td></tr>` : ''}
      <tr>
        <td style="padding:20px 24px 24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#16a34a;">&#10003; Your booking is confirmed!</p>
          <h1 style="margin:0 0 8px;font-size:21px;line-height:1.3;">Get ready for an amazing experience, ${escapeHtml(order.leadFirstName)}!</h1>
          <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">We can&rsquo;t wait to show you the best of Barcelona.</p>
          <p style="margin:0 0 14px;font-size:13px;color:#6b7280;">A confirmation email has been sent to <span style="font-weight:600;color:#374151;">${escapeHtml(order.email)}</span>.</p>
          <p style="margin:0;display:inline-block;font-size:12px;font-weight:600;color:#374151;background:#ffffff;border:1px solid #e5e7eb;border-radius:9999px;padding:6px 14px;">Order reference: ${escapeHtml(order.reference)}</p>
        </td>
      </tr>
    </table>

    ${bookingSections}

    ${
      order.bookings.length > 1
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f9fafb;border-radius:12px;margin-bottom:24px;"><tr><td style="padding:14px 18px;font-size:14px;color:#374151;">Total paid for this order</td><td style="padding:14px 18px;font-size:16px;font-weight:700;text-align:right;">${formatPrice(order.totalPrice, order.currency)}</td></tr></table>`
        : ''
    }

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#eff6ff;border:1px solid #dbeafe;border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#111827;">Important to know</p>
          ${bulletListHtml(
            [
              'Please arrive 15 minutes before your selected time slot.',
              'Show the QR code above at the entrance.',
              'Bring a valid ID or passport matching the traveler names.',
              'Large bags and luggage are not allowed inside.'
            ],
            '#374151',
            '&#10003;',
            '#2563eb'
          )}
        </td>
      </tr>
    </table>

    ${footerHtml()}
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
  const attractionBySlug = await getAttractionsBySlug(order.bookings);

  await resend.emails.send({
    from,
    to: order.email,
    subject: `Your booking has been cancelled — ${order.reference}`,
    html: orderCancellationEmailHtml(order, refundEligible, attractionBySlug)
  });
}

function orderCancellationEmailHtml(order: OrderWithBookings, refundEligible: boolean, attractionBySlug: Map<string, AttractionWithImages>): string {
  const bookingSections = order.bookings.map((b) => bookingCardHtml(b, attractionBySlug.get(b.attractionSlug), true)).join('');

  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#111827;background:#ffffff;">
    ${brandHeaderHtml()}

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#fef2f2;border:1px solid #fecaca;border-radius:16px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#dc2626;">&#10005; This booking has been cancelled</p>
          <h1 style="margin:0 0 8px;font-size:21px;line-height:1.3;">Booking cancelled, ${escapeHtml(order.leadFirstName)}</h1>
          <p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#374151;">
            ${
              refundEligible
                ? "This booking qualified for free cancellation, and we're processing your refund — it should appear on your original payment method within a few business days."
                : "This booking was outside our free-cancellation window, so it wasn't automatically eligible for a refund. If you'd like to discuss this, reply to this email or contact us."
            }
          </p>
          <p style="margin:0;display:inline-block;font-size:12px;font-weight:600;color:#374151;background:#ffffff;border:1px solid #e5e7eb;border-radius:9999px;padding:6px 14px;">Order reference: ${escapeHtml(order.reference)}</p>
        </td>
      </tr>
    </table>

    ${bookingSections}

    ${footerHtml()}
  </div>`;
}

// Sent right after someone signs up with email + password (see
// signUpAction in src/app/account/(auth)/sign-up/actions.ts). They can't
// sign in until they click the link — "Continue with Google" accounts skip
// this entirely since Google has already verified that email.
export async function sendVerificationEmail(to: string, firstName: string, verifyUrl: string): Promise<void> {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM is not set. Add it to your .env file (see .env.example).');
  }

  const resend = getResendClient();

  await resend.emails.send({
    from,
    to,
    subject: 'Confirm your email — Vacay in Barcelona',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#111827;">
        <p style="font-size:13px;color:#2563eb;font-weight:600;letter-spacing:.02em;margin:0 0 4px;">VACAY IN BARCELONA</p>
        <h1 style="font-size:20px;margin:0 0 12px;">Confirm your email, ${escapeHtml(firstName)}</h1>
        <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">
          Click the button below to confirm your email address and activate your account. This link expires in 48 hours.
        </p>
        <a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:9999px;">
          Confirm email
        </a>
        <p style="font-size:12px;color:#9ca3af;margin-top:32px;line-height:1.6;">
          If you didn't create an account with Vacay in Barcelona, you can safely ignore this email.
        </p>
      </div>`
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
