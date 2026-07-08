import Link from 'next/link';
import { prisma } from '@/lib/db';
import { formatPrice } from '@/lib/format';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { deleteAttraction } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminAttractionsPage() {
  const attractions = await prisma.attraction.findMany({ orderBy: { sortOrder: 'asc' } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Attractions & tours</h1>
        <Link href="/admin/attractions/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Price from</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Popular tour</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attractions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  No attractions yet — create your first one.
                </td>
              </tr>
            ) : (
              attractions.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500">{a.categoryLabel || a.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        a.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatPrice(a.priceFrom, a.currency)}</td>
                  <td className="px-4 py-3 text-gray-500">{a.featured ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{a.popularTour ? 'Yes' : '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/attractions/${a.slug}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        Edit
                      </Link>
                      <form action={deleteAttraction.bind(null, a.id)}>
                        <DeleteButton confirmText={`Delete ${a.name}? This also deletes its tickets, images, FAQs and reviews.`} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
