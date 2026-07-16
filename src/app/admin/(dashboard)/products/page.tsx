import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import { SavedToast } from '@/components/admin/SavedToast';
import { approveProductAction, disableProductAction, republishProductAction } from './actions';

const STATUS_STYLES: Record<string, string> = {
  pending_review: 'bg-amber-50 text-amber-700 border-amber-100',
  published: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: 'Pending review',
  published: 'Published',
  rejected: 'Rejected',
  disabled: 'Disabled'
};

export default async function AdminProductsPage({
  searchParams
}: {
  searchParams: { status?: string; attraction?: string; supplier?: string };
}) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');

  const statusFilter = searchParams?.status || '';
  const attractionFilter = searchParams?.attraction || '';
  const supplierFilter = searchParams?.supplier || ''; // 'house' | supplierId | ''

  const where: Record<string, unknown> = {};
  if (statusFilter) where.status = statusFilter;
  if (attractionFilter) where.attractionId = attractionFilter;
  if (supplierFilter === 'house') where.supplierId = null;
  else if (supplierFilter) where.supplierId = supplierFilter;

  const [products, attractions, suppliers, pendingCount] = await Promise.all([
    prisma.ticketOption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { attraction: { select: { name: true } }, supplier: { select: { id: true, companyName: true } } }
    }),
    prisma.attraction.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true } }),
    prisma.supplier.findMany({ where: { status: 'approved' }, orderBy: { companyName: 'asc' }, select: { id: true, companyName: true } }),
    prisma.ticketOption.count({ where: { status: 'pending_review' } })
  ]);

  function buildHref(overrides: Record<string, string>) {
    const params = new URLSearchParams({ status: statusFilter, attraction: attractionFilter, supplier: supplierFilter, ...overrides });
    for (const [key, value] of Array.from(params.entries())) {
      if (!value) params.delete(key);
    }
    const query = params.toString();
    return `/admin/products${query ? `?${query}` : ''}`;
  }

  return (
    <div>
      <SavedToast />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            All products across every category and supplier.
            {pendingCount > 0 ? <span className="text-amber-600 font-medium"> {pendingCount} awaiting review.</span> : null}
          </p>
        </div>
        <Link href="/admin/products/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add house product
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {['', 'pending_review', 'published', 'rejected', 'disabled'].map((s) => (
            <Link
              key={s || 'all'}
              href={buildHref({ status: s })}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              {s ? STATUS_LABELS[s] : 'All statuses'}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={buildHref({ attraction: '' })}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            !attractionFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          All categories
        </Link>
        {attractions.map((a) => (
          <Link
            key={a.id}
            href={buildHref({ attraction: a.id })}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              attractionFilter === a.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {a.name}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href={buildHref({ supplier: '' })}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            !supplierFilter ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          All sellers
        </Link>
        <Link
          href={buildHref({ supplier: 'house' })}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
            supplierFilter === 'house' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          House products
        </Link>
        {suppliers.map((s) => (
          <Link
            key={s.id}
            href={buildHref({ supplier: s.id })}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
              supplierFilter === s.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {s.companyName}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">No products match these filters.</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 hover:opacity-80">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {p.attraction.name} &middot; {p.supplier ? p.supplier.companyName : 'House product'}
                </p>
              </Link>
              <p className="text-sm font-medium whitespace-nowrap">{formatPrice(p.price, p.currency)}</p>
              <div className="flex items-center gap-2 whitespace-nowrap">
                {p.status === 'pending_review' ? (
                  <form action={approveProductAction.bind(null, p.id)}>
                    <button type="submit" className="text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1.5">
                      Approve
                    </button>
                  </form>
                ) : null}
                {p.status === 'published' ? (
                  <form action={disableProductAction.bind(null, p.id)}>
                    <button type="submit" className="text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
                      Disable
                    </button>
                  </form>
                ) : null}
                {p.status === 'disabled' || p.status === 'rejected' ? (
                  <form action={republishProductAction.bind(null, p.id)}>
                    <button type="submit" className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1.5">
                      Publish
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
