import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate, formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/attractions');

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: { bookings: true }
  });

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Bookings</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Lead traveler</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Booked on</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">
                    <Link href={`/admin/bookings/${order.reference}`} className="text-blue-600 hover:text-blue-700">
                      {order.reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.bookings.length === 1
                      ? order.bookings[0].attractionName
                      : `${order.bookings.length} experiences`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {order.leadFirstName} {order.leadLastName}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{order.email}</td>
                  <td className="px-4 py-3">{formatPrice(order.totalPrice, order.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : order.status === 'cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(order.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
