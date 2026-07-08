import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/customerAuth';
import { formatDate } from '@/lib/format';

export default async function AccountOverviewPage({ searchParams }: { searchParams: { verified?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects, this satisfies TypeScript

  const orderCount = await prisma.order.count({
    where: { OR: [{ userId: user.id }, { email: user.email }] }
  });

  return (
    <div className="space-y-6">
      {searchParams?.verified ? (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          Email confirmed — welcome!
        </p>
      ) : null}

      <div className="border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Account details</h2>
          <Link href="/account/settings" className="text-xs text-blue-600 font-medium hover:text-blue-700">
            Edit &rarr;
          </Link>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Name</dt>
            <dd>{user.firstName} {user.lastName}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Phone</dt>
            <dd>{user.phone || <span className="text-gray-400">Not added</span>}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 mb-0.5">Date of birth</dt>
            <dd>{user.dateOfBirth ? formatDate(user.dateOfBirth) : <span className="text-gray-400">Not added</span>}</dd>
          </div>
        </dl>
      </div>

      <div className="border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">My bookings</h2>
          <Link href="/account/orders" className="text-xs text-blue-600 font-medium hover:text-blue-700">
            View all &rarr;
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          {orderCount === 0
            ? "You haven't booked anything yet."
            : `${orderCount} booking${orderCount === 1 ? '' : 's'} on file.`}
        </p>
      </div>
    </div>
  );
}
