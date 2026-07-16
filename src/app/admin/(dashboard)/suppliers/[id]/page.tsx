import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { SavedToast } from '@/components/admin/SavedToast';
import {
  approveSupplierAction,
  rejectSupplierAction,
  updateSupplierCategoriesAction,
  setSupplierAccountStatusAction
} from '../actions';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  approved: 'bg-green-50 text-green-700 border-green-100',
  rejected: 'bg-red-50 text-red-700 border-red-100',
  disabled: 'bg-gray-100 text-gray-500 border-gray-200'
};

export default async function SupplierReviewPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string } }) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');

  const supplier = await prisma.supplier.findUnique({
    where: { id: params.id },
    include: {
      categories: { include: { attraction: { select: { id: true, name: true } } } },
      products: { select: { id: true, name: true, status: true } }
    }
  });
  if (!supplier) notFound();

  const allCategories = await prisma.attraction.findMany({ orderBy: { sortOrder: 'asc' }, select: { id: true, name: true, categoryLabel: true } });
  const assignedIds = new Set(supplier.categories.map((c) => c.attractionId));

  const disableAction = setSupplierAccountStatusAction.bind(null, supplier.id, 'disabled');
  const reenableAction = setSupplierAccountStatusAction.bind(null, supplier.id, 'approved');

  return (
    <div className="max-w-2xl">
      <SavedToast />
      <Link href="/admin/suppliers" className="text-sm text-blue-600 mb-4 inline-block">
        &larr; Back to suppliers
      </Link>

      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-xl font-semibold">{supplier.companyName}</h1>
        <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[supplier.status]}`}>
          {supplier.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-6">Applied {formatDate(supplier.createdAt)}</p>

      {searchParams?.error === 'no-categories' ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          Select at least one category before approving.
        </p>
      ) : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-3 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Contact</p>
            <p>{supplier.contactName}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Email</p>
            <p>{supplier.email}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
            <p>{supplier.phone || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-0.5">Website</p>
            <p className="truncate">{supplier.website || '—'}</p>
          </div>
        </div>
        {supplier.message ? (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Message</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{supplier.message}</p>
          </div>
        ) : null}
      </div>

      {supplier.status === 'pending' || supplier.status === 'rejected' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          {supplier.status === 'rejected' && supplier.rejectionReason ? (
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Previous rejection reason</p>
              <p className="text-sm text-gray-700 whitespace-pre-line">{supplier.rejectionReason}</p>
            </div>
          ) : null}
          <div>
            <p className="text-sm font-semibold mb-2">Assign categories</p>
            <div className="space-y-2">
              {allCategories.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5">
                  <input type="checkbox" name="categoryIds" value={c.id} form="approve-form" defaultChecked={assignedIds.has(c.id)} className="h-4 w-4" />
                  <span>
                    {c.name}
                    {c.categoryLabel ? <span className="text-gray-400"> — {c.categoryLabel}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <form id="approve-form" action={approveSupplierAction.bind(null, supplier.id)}>
              <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                Approve
              </button>
            </form>
            <details className="flex-1">
              <summary className="text-sm text-red-600 font-medium cursor-pointer select-none">Reject instead</summary>
              <form action={rejectSupplierAction.bind(null, supplier.id)} className="mt-3 space-y-2">
                <textarea
                  name="rejectionReason"
                  rows={2}
                  placeholder="Reason (optional, included in the rejection email)"
                  className="input text-sm"
                />
                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg">
                  Reject application
                </button>
              </form>
            </details>
          </div>
        </div>
      ) : null}

      {supplier.status === 'approved' || supplier.status === 'disabled' ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <form action={updateSupplierCategoriesAction.bind(null, supplier.id)}>
            <p className="text-sm font-semibold mb-2">Assigned categories</p>
            <div className="space-y-2 mb-4">
              {allCategories.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5">
                  <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={assignedIds.has(c.id)} className="h-4 w-4" />
                  <span>
                    {c.name}
                    {c.categoryLabel ? <span className="text-gray-400"> — {c.categoryLabel}</span> : null}
                  </span>
                </label>
              ))}
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
              Save categories
            </button>
          </form>

          <div className="pt-4 border-t border-gray-100">
            {supplier.status === 'approved' ? (
              <form action={disableAction}>
                <button type="submit" className="text-sm text-red-600 font-medium">
                  Disable this supplier&rsquo;s account
                </button>
                <p className="text-[11px] text-gray-400 mt-1">Blocks login and hides all of their products from the public site.</p>
              </form>
            ) : (
              <form action={reenableAction}>
                <button type="submit" className="text-sm text-green-600 font-medium">
                  Re-enable this supplier&rsquo;s account
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {supplier.products.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold mb-2">Products ({supplier.products.length})</p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
            {supplier.products.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                <span>{p.name}</span>
                <span className="text-xs text-gray-400 capitalize">{p.status.replace('_', ' ')}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
