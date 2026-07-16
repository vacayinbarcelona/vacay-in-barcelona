import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { formatDateShort, formatPrice, formatTime12h } from '@/lib/format';
import { buildIcsDataUri } from '@/lib/ics';
import { CopyReferenceButton } from '@/components/booking/CopyReferenceButton';
import { RelatedAttractions } from '@/components/attraction/RelatedAttractions';
import { IconCalendar, IconCheck, IconClock, IconMail, IconPhone, IconPin, IconX } from '@/components/ui/Icons';
import type { AttractionCardData } from '@/types';

export const metadata: Metadata = { robots: { index: false, follow: false } };

async function getOrder(reference: string) {
  return prisma.order.findUnique({
    where: { reference },
    include: { bookings: { include: { travelers: { orderBy: { sortOrder: 'asc' } } } } }
  });
}

export default async function BookingConfirmationPage({ params }: { params: { reference: string } }) {
  const order = await getOrder(params.reference);
  if (!order) notFound();

  const isCancelled = order.status === 'cancelled';

  const attractionSlugs = Array.from(new Set(order.bookings.map((b) => b.attractionSlug)));
  const attractions = await prisma.attraction.findMany({
    where: { slug: { in: attractionSlugs } },
    include: { images: { orderBy: { sortOrder: 'asc' } } }
  });
  const attractionBySlug = new Map(attractions.map((a) => [a.slug, a]));

  const relatedAttractions: AttractionCardData[] = await prisma.attraction.findMany({
    where: { status: 'published', city: 'Barcelona', slug: { notIn: attractionSlugs } },
    orderBy: { sortOrder: 'asc' },
    take: 3
  });

  // The hero (photo, "Add to calendar", "Get directions") is anchored to
  // the first item in the order — the common case is a single-item order,
  // and each item still gets its own meeting-point card further down for
  // multi-item orders.
  const primaryBooking = order.bookings[0];
  const primaryAttraction = primaryBooking ? attractionBySlug.get(primaryBooking.attractionSlug) : undefined;
  const heroPhoto = primaryAttraction?.images[0]?.url ?? primaryAttraction?.heroImageUrl;
  const heroPhotoAlt = primaryAttraction?.images[0]?.altText ?? primaryAttraction?.heroImageAlt ?? primaryBooking?.attractionName ?? '';
  const primaryAddress = primaryAttraction?.address ?? '';
  const primaryMapUrl =
    primaryAttraction?.mapUrl || (primaryAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryAddress)}` : '');

  let heroIcsDataUri = '';
  if (primaryBooking) {
    const [year, month, day] = primaryBooking.bookingDate.toISOString().slice(0, 10).split('-').map(Number);
    const [hour, minute] = primaryBooking.timeSlot.split(':').map(Number);
    heroIcsDataUri = buildIcsDataUri({
      title: `${primaryBooking.attractionName} — ${primaryBooking.ticketOptionName}`,
      description: `Order reference ${order.reference}. Show this booking or your mobile ticket at entry.`,
      location: primaryAddress || primaryBooking.attractionName,
      start: new Date(year, month - 1, day, hour || 9, minute || 0)
    });
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero */}
      <section className="bg-gray-50 rounded-2xl overflow-hidden grid grid-cols-1 sm:grid-cols-2 border border-gray-100">
        <div className="p-6 sm:p-8 flex flex-col justify-center">
          {isCancelled ? (
            <>
              <div className="flex items-center gap-1.5 text-red-600 text-sm font-medium mb-3">
                <IconX className="h-4 w-4" />
                This booking has been cancelled
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-3">
                This booking has been cancelled, {order.leadFirstName}
              </h1>
              <p className="text-sm text-gray-600 mb-1">
                {order.refundEligible === true
                  ? "It qualified for free cancellation — we'll process your refund shortly."
                  : order.refundEligible === false
                    ? "It was outside our free-cancellation window, so it wasn't automatically eligible for a refund. Contact us if you'd like to discuss it."
                    : 'If you were charged, our team will follow up about a refund.'}
              </p>
              <p className="text-sm text-gray-600 mb-5">
                A cancellation email has been sent to <span className="font-medium">{order.email}</span>.
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium mb-3">
                <IconCheck className="h-4 w-4" />
                Your booking is confirmed!
              </div>
              <h1 className="text-2xl sm:text-3xl font-semibold leading-tight mb-3">
                Get ready for an amazing experience, {order.leadFirstName}!
              </h1>
              <p className="text-sm text-gray-600 mb-1">We can&rsquo;t wait to show you the best of Barcelona.</p>
              <p className="text-sm text-gray-600 mb-5">
                A confirmation email has been sent to <span className="font-medium">{order.email}</span>.
              </p>
            </>
          )}

          <div className="mb-4">
            <CopyReferenceButton reference={order.reference} />
          </div>

          {!isCancelled ? (
            <div className="flex flex-wrap gap-2">
              {heroIcsDataUri ? (
                <a
                  href={heroIcsDataUri}
                  download={`${order.reference}.ics`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-full"
                >
                  <IconCalendar />
                  Add to calendar
                </a>
              ) : null}
              {primaryMapUrl ? (
                <a
                  href={primaryMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 rounded-full"
                >
                  <IconPin />
                  Get directions
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="relative min-h-[220px] sm:min-h-full">
          {heroPhoto ? <Image src={heroPhoto} alt={heroPhotoAlt} fill priority className="object-cover" sizes="(min-width: 640px) 50vw, 100vw" /> : null}
        </div>
      </section>

      {/* One unified ticket card + meeting point card per item in the order */}
      {order.bookings.map((booking) => {
        const attraction = attractionBySlug.get(booking.attractionSlug);
        const thumbnail = attraction?.images[0]?.url ?? attraction?.heroImageUrl;
        const thumbnailAlt = attraction?.images[0]?.altText ?? attraction?.heroImageAlt ?? booking.attractionName;
        // Meeting point, included/not included, and before-you-go are all
        // frozen at booking time on the Booking itself (product-specific —
        // see checkout/actions.ts) rather than read live from the
        // attraction, so this always reflects exactly what the customer
        // was told when they booked this specific ticket.
        const meetingPointAddress = booking.meetingPointAddress || attraction?.address || '';
        const meetingPointInstruction = booking.meetingPoint || '';
        const hasMeetingPointInfo = Boolean(meetingPointAddress || meetingPointInstruction);
        const mapUrl =
          attraction?.mapUrl ||
          (meetingPointAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetingPointAddress)}` : '');
        const includedBullets = booking.includedSnapshot.split('\n').filter(Boolean);
        const notIncludedBullets = booking.notIncludedSnapshot.split('\n').filter(Boolean);
        const beforeYouGoBullets = booking.beforeYouGoSnapshot.split('\n').filter(Boolean);

        const guestsLabel = `${booking.adults} adult${booking.adults !== 1 ? 's' : ''}${
          booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''
        }`;
        const qrData = encodeURIComponent(`${order.reference} | ${booking.attractionName} | ${formatDateShort(booking.bookingDate)} ${formatTime12h(booking.timeSlot)}`);
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

        return (
          <div key={booking.id}>
            <section className={`mt-8 border rounded-2xl overflow-hidden ${isCancelled ? 'border-red-100' : 'border-gray-200'}`}>
              <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                <div
                  className={`flex flex-col items-center justify-center gap-2 p-6 border-b sm:border-b-0 sm:border-r ${
                    isCancelled ? 'bg-red-50/40 border-red-100' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {isCancelled ? (
                    <div className="w-32 h-32 rounded-lg bg-white border border-gray-200 flex flex-col items-center justify-center gap-1.5">
                      <IconX className="h-6 w-6 text-red-500" />
                      <p className="text-[11px] font-medium text-red-600">No longer valid</p>
                    </div>
                  ) : (
                    // External QR code image — generated on the fly, no local asset needed
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrCodeUrl} alt="Ticket QR code" className="w-32 h-32 rounded-lg bg-white p-1.5 border border-gray-200" />
                  )}
                  <p className="text-[11px] text-gray-500 text-center">
                    {isCancelled ? 'This ticket has been cancelled' : 'Show this at entry — no printing needed'}
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start gap-4 pb-4 border-b border-gray-100">
                    {thumbnail ? (
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={thumbnail} alt={thumbnailAlt} fill className={`object-cover ${isCancelled ? 'grayscale opacity-70' : ''}`} sizes="56px" />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-sm font-semibold">{booking.attractionName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{booking.ticketOptionName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">{isCancelled ? 'Amount' : 'Total paid'}</p>
                      <p className="text-base font-semibold">{formatPrice(booking.totalPrice, booking.currency)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 py-4 border-b border-gray-100">
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Date &amp; time</p>
                      <p className="text-sm font-medium">
                        {formatDateShort(booking.bookingDate)} &middot; {formatTime12h(booking.timeSlot)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Guests</p>
                      <p className="text-sm font-medium">{guestsLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400 mb-1">Language</p>
                      <p className="text-sm font-medium">{booking.language || '—'}</p>
                    </div>
                  </div>

                  {booking.travelers.length > 0 ? (
                    <div className="py-4 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Travelers</p>
                      <div className="flex flex-wrap gap-2">
                        {booking.travelers.map((t) => (
                          <span key={t.id} className="text-xs bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                            {t.firstName} {t.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {hasMeetingPointInfo ? (
                    <div className="py-4 border-b border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Meeting point</p>
                      <div className="flex items-start gap-3 text-sm">
                        {booking.meetingPointImage ? (
                          // Plain <img>, not next/image — this URL is a free-text admin field
                          // (any external host), and next/image requires each remote hostname
                          // to be allowlisted in next.config.js ahead of time.
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={booking.meetingPointImage}
                            alt="Meeting point"
                            className="w-20 h-20 flex-shrink-0 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <IconPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          {meetingPointAddress ? <p className="text-gray-700 font-medium">{meetingPointAddress}</p> : null}
                          {meetingPointInstruction ? (
                            <p className="text-gray-600 whitespace-pre-line mt-0.5">{meetingPointInstruction}</p>
                          ) : null}
                          {mapUrl ? (
                            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-medium hover:underline">
                              Open in Google Maps
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {!isCancelled && (booking.supplierContactEmail || booking.supplierContactPhone) ? (
                    <div className="py-4 border-b border-gray-100">
                      <div className="bg-blue-50/60 border border-blue-100 rounded-xl px-4 py-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Contact your supplier</p>
                        <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                          {booking.supplierContactEmail ? (
                            <a
                              href={`mailto:${booking.supplierContactEmail}`}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:underline"
                            >
                              <IconMail className="h-4 w-4" />
                              {booking.supplierContactEmail}
                            </a>
                          ) : null}
                          {booking.supplierContactPhone ? (
                            <a
                              href={`tel:${booking.supplierContactPhone.replace(/[^\d+]/g, '')}`}
                              className="inline-flex items-center gap-1.5 text-sm text-blue-700 font-medium hover:underline"
                            >
                              <IconPhone className="h-4 w-4" />
                              {booking.supplierContactPhone}
                            </a>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1.5">Reach out directly if you have any questions about this booking.</p>
                      </div>
                    </div>
                  ) : null}

                  {includedBullets.length > 0 || notIncludedBullets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {includedBullets.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">What&rsquo;s included</p>
                          <ul className="space-y-1.5 text-sm text-gray-700">
                            {includedBullets.map((text, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <IconCheck className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                {text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {notIncludedBullets.length > 0 ? (
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-2">Not included</p>
                          <ul className="space-y-1.5 text-sm text-gray-500">
                            {notIncludedBullets.map((text, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <IconX className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                {text}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {attraction?.freeCancellation && !isCancelled ? (
                    <p className="text-[11px] text-gray-400 mt-4 pt-4 border-t border-gray-100 flex items-center gap-1.5">
                      <IconClock className="h-3.5 w-3.5" />
                      Free cancellation up to 24 hours before the experience
                    </p>
                  ) : null}

                  {beforeYouGoBullets.length > 0 ? (
                    <div className="pt-4 mt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-600 mb-2">Before you go</p>
                      <ul className="space-y-1.5 text-sm text-gray-700">
                        {beforeYouGoBullets.map((text, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-gray-400 mt-0.5">&bull;</span>
                            {text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        );
      })}

      {/* Order total, when there's more than one item */}
      {order.bookings.length > 1 ? (
        <div className="mt-8 flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
          <span className="text-sm font-medium">Total paid for this order</span>
          <span className="text-lg font-semibold">{formatPrice(order.totalPrice, order.currency)}</span>
        </div>
      ) : null}

      {/* Important to know */}
      {isCancelled ? (
        <section className="mt-8 bg-red-50/50 border border-red-100 rounded-2xl p-5 sm:p-6">
          <h3 className="text-sm font-semibold mb-2">Questions about this cancellation?</h3>
          <p className="text-sm text-gray-600 mb-3">
            {order.cancellationReason ? (
              <>
                Cancellation reason: <span className="font-medium">{order.cancellationReason}</span>.{' '}
              </>
            ) : null}
            Reach out to our support team if you&rsquo;d like to discuss this booking or a refund.
          </p>
          <Link
            href="/contact-us"
            className="inline-block border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-full"
          >
            Contact us
          </Link>
        </section>
      ) : (
        <section className="mt-8 bg-blue-50/60 border border-blue-100 rounded-2xl p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold mb-3">Important to know</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <IconCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                Please arrive 15 minutes before your selected time slot.
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                Show the QR code above at the entrance.
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                Bring a valid ID or passport matching the traveler names.
              </li>
              <li className="flex items-start gap-2">
                <IconCheck className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                Large bags and luggage are not allowed inside.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">Need to make changes?</h3>
            <p className="text-sm text-gray-600 mb-3">You can manage your booking or get help from our support team.</p>
            <Link
              href="/contact-us"
              className="inline-block border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium px-5 py-2.5 rounded-full"
            >
              Manage booking
            </Link>
          </div>
        </section>
      )}

      <div className="mt-4">
        <RelatedAttractions attractions={relatedAttractions} />
      </div>
    </div>
  );
}
