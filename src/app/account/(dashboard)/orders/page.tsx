import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/customerAuth';
import { formatDate, formatPrice } from '@/lib/format';

export default async function AccountOrdersPage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects

  // Match orders linked to this account, plus any guest-checkout orders
  // placed with the same email address before the customer had an account.
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: 'desc' },
    include: { bookings: true }
  });

  if (orders.length === 0) {
    return (
      <div className="border border-gray-200 rounded-2xl p-10 text-center">
        <p className="text-sm text-gray-500 mb-4">You haven&apos;t booked anything yet.</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full inline-block">
          Browse attractions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/booking-confirmation/${order.reference}`}
          className="block border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Reference {order.reference}</p>
              <p className="text-sm font-medium">
                {order.bookings.length} item{order.bookings.length === 1 ? '' : 's'} · booked {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{formatPrice(order.totalPrice, order.currency)}</p>
              <span
                className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                  order.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
          <ul className="text-xs text-gray-500 space-y-0.5">
            {order.bookings.map((booking) => (
              <li key={booking.id}>
                {booking.attractionName} — {booking.ticketOptionName} · {formatDate(booking.bookingDate)}
              </li>
            ))}
          </ul>
        </Link>
      ))}
    </div>
  );
}
