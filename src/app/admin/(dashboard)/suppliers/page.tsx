import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { SavedToast } from '@/components/admin/SavedToast';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

const TABS = ['pending', 'approved', 'rejected', 'disabled'] as const;

export default async function AdminSuppliersPage({ searchParams }: { searchParams: { status?: string } }) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');

  const activeTab = (TABS as readonly string[]).includes(searchParams?.status ?? '') ? (searchParams!.status as string) : 'pending';

  const [suppliers, counts] = await Promise.all([
    prisma.supplier.findMany({
      where: { status: activeTab },
      orderBy: { createdAt: 'desc' },
      include: { categories: { include: { attraction: { select: { name: true } } } } }
    }),
    prisma.supplier.groupBy({ by: ['status'], _count: { status: true } })
  ]);
  const countByStatus = new Map(counts.map((c) => [c.status, c._count.status]));

  return (
    <div>
      <SavedToast />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Suppliers</h1>
          <p className="text-sm text-gray-500 mt-1">Review applications, assign categories, and manage supplier access.</p>
        </div>
        <Link href="/become-a-supplier" target="_blank" className="text-sm text-blue-600 font-medium">
          View application form &rarr;
        </Link>
      </div>

      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/admin/suppliers?status=${tab}`}
            className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px ${
              activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab} {countByStatus.get(tab) ? <span className="text-gray-400">({countByStatus.get(tab)})</span> : null}
          </Link>
        ))}
      </div>

      {suppliers.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          No {activeTab} suppliers.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {suppliers.map((s) => (
            <Link
              key={s.id}
              href={`/admin/suppliers/${s.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{s.companyName}</p>
                  <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[s.status]}`}>
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {s.contactName} &middot; {s.email}
                </p>
                {s.categories.length > 0 ? (
                  <p className="text-[11px] text-gray-400 mt-1 truncate">
                    {s.categories.map((c) => c.attraction.name).join(', ')}
                  </p>
                ) : null}
              </div>
              <p className="text-xs text-gray-400 whitespace-nowrap ml-4">{formatDate(s.createdAt)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
