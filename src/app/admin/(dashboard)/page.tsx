import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatDate, formatPrice } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const [attractionCount, publishedCount, bookingCount, recentOrders] = await Promise.all([
    prisma.attraction.count(),
    prisma.attraction.count({ where: { status: 'published' } }),
    prisma.order.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 8, include: { bookings: true } })
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <StatCard label="Attractions & tours" value={attractionCount} sublabel={`${publishedCount} published`} href="/admin/attractions" />
        <StatCard label="Bookings" value={bookingCount} href="/admin/bookings" />
        <StatCard label="Add new attraction" value="+" href="/admin/attractions/new" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Recent bookings</h2>
        <Link href="/admin/bookings" className="text-xs text-blue-600 font-medium">
          View all &rarr;
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Ordered</th>
              <th className="px-4 py-3">Lead traveler</th>
              <th className="px-4 py-3">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">
                  No bookings yet.
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">{order.reference}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.bookings.length === 1 ? order.bookings[0].attractionName : `${order.bookings.length} experiences`}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {order.leadFirstName} {order.leadLastName}
                  </td>
                  <td className="px-4 py-3">{formatPrice(order.totalPrice, order.currency)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, sublabel, href }: { label: string; value: number | string; sublabel?: string; href: string }) {
  return (
    <Link href={href} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow block">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      {sublabel ? <p className="text-[11px] text-gray-400 mt-1">{sublabel}</p> : null}
    </Link>
  );
}
