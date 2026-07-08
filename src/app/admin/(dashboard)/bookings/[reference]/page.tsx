import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminBookingDetailPage({ params }: { params: { reference: string } }) {
  const order = await prisma.order.findUnique({
    where: { reference: params.reference },
    include: { bookings: { include: { travelers: { orderBy: { sortOrder: 'asc' } } } } }
  });
  if (!order) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/bookings" className="text-xs text-blue-600 font-medium">
        &larr; All bookings
      </Link>

      <div className="flex items-center justify-between mt-3 mb-6">
        <h1 className="text-xl font-semibold">{order.reference}</h1>
        <span
          className={`text-xs px-2.5 py-1 rounded-full ${
            order.status === 'confirmed'
              ? 'bg-green-100 text-green-700'
              : order.status === 'cancelled'
                ? 'bg-red-100 text-red-700'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {order.status}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 mb-6">
        <div>
          <p className="text-[11px] text-gray-400 mb-1">Lead traveler / contact</p>
          <p className="text-sm">
            {order.leadFirstName} {order.leadLastName}
          </p>
          <p className="text-xs text-gray-500">{order.email}</p>
          {order.phone ? <p className="text-xs text-gray-500">{order.phone}</p> : null}
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
          <p className="text-sm font-medium">Total paid</p>
          <p className="text-sm font-semibold">{formatPrice(order.totalPrice, order.currency)}</p>
        </div>

        <div className="border-t border-gray-100 pt-4 text-xs text-gray-400 space-y-1">
          <p>Ordered {formatDate(order.createdAt)}</p>
          <p>Confirmation email {order.confirmationEmailSentAt ? `sent ${formatDate(order.confirmationEmailSentAt)}` : 'not sent'}</p>
        </div>
      </div>

      <p className="text-xs font-medium text-gray-500 mb-2">Items ({order.bookings.length})</p>
      <div className="space-y-4">
        {order.bookings.map((booking) => (
          <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-[11px] text-gray-400">{booking.attractionName}</p>
            <p className="text-sm font-medium mb-3">{booking.ticketOptionName}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[11px] text-gray-400">Date &amp; time</p>
                <p>
                  {formatDate(booking.bookingDate)} at {booking.timeSlot}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Language</p>
                <p>{booking.language || '—'}</p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Guests</p>
                <p>
                  {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                  {booking.children > 0 ? `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}` : ''}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-gray-400">Price</p>
                <p className="font-semibold">{formatPrice(booking.totalPrice, booking.currency)}</p>
              </div>
            </div>

            {booking.travelers.length > 0 ? (
              <div className="border-t border-gray-100 mt-3 pt-3">
                <p className="text-[11px] text-gray-400 mb-2">Travelers</p>
                <div className="flex flex-wrap gap-2">
                  {booking.travelers.map((t) => (
                    <span key={t.id} className="text-xs bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                      {t.firstName} {t.lastName} <span className="text-gray-400">({t.type})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
