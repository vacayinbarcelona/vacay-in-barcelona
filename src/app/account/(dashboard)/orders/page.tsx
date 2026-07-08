import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/customerAuth';
import { formatDate, formatPrice } from '@/lib/format';
import { requestCancellation } from './actions';

const CANCEL_REASONS = [
  'Change of plans',
  'Booked by mistake',
  'Found a better price elsewhere',
  'Weather or health issue',
  'Other'
];

const ERROR_MESSAGES: Record<string, string> = {
  reason: 'Please select a reason for cancelling.',
  notfound: "We couldn't find that booking on your account.",
  'already-cancelled': 'That booking is already cancelled.',
  past: "This booking's visit date has already passed, so it can't be cancelled."
};

export default async function AccountOrdersPage({
  searchParams
}: {
  searchParams: { cancelled?: string; refund?: string; error?: string };
}) {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects

  // Match orders linked to this account, plus any guest-checkout orders
  // placed with the same email address before the customer had an account.
  const orders = await prisma.order.findMany({
    where: { OR: [{ userId: user.id }, { email: user.email }] },
    orderBy: { createdAt: 'desc' },
    include: { bookings: true }
  });

  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;

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
      {searchParams?.cancelled ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Booking cancelled.{' '}
          {searchParams.refund === '1'
            ? "It qualified for free cancellation — we'll process your refund shortly."
            : "It was outside our free-cancellation window, so it wasn't automatically eligible for a refund. Contact us if you'd like to discuss it."}
        </p>
      ) : null}
      {errorMessage ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      {orders.map((order) => {
        const canCancel = order.status !== 'cancelled' && order.bookings.some((b) => b.bookingDate.getTime() >= Date.now());

        return (
          <div key={order.id} className="border border-gray-200 rounded-2xl p-5">
            <Link href={`/booking-confirmation/${order.reference}`} className="block hover:opacity-80 transition-opacity">
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
                      order.status === 'confirmed'
                        ? 'bg-green-50 text-green-700'
                        : order.status === 'cancelled'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gray-100 text-gray-600'
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

            {canCancel ? (
              <details className="mt-3 pt-3 border-t border-gray-100">
                <summary className="text-xs text-red-600 font-medium cursor-pointer hover:text-red-700 select-none">
                  Cancel this booking
                </summary>
                <form action={requestCancellation.bind(null, order.id)} className="mt-3 space-y-2 max-w-sm">
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Reason for cancellation</label>
                    <select name="reason" required className="input text-sm">
                      <option value="">Select a reason…</option>
                      {CANCEL_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Anything else? (optional)</label>
                    <textarea name="details" rows={2} className="input text-sm" />
                  </div>
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-xs font-medium px-4 py-2 rounded-lg">
                    Submit cancellation
                  </button>
                </form>
              </details>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
