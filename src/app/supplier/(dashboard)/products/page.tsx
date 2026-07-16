import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { formatPrice } from '@/lib/format';
import { SavedToast } from '@/components/admin/SavedToast';

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

export default async function SupplierProductsPage() {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');

  const products = await prisma.ticketOption.findMany({
    where: { supplierId: supplier.id },
    orderBy: { createdAt: 'desc' },
    include: { attraction: { select: { name: true } } }
  });

  return (
    <div>
      <SavedToast />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">My products</h1>
          <p className="text-sm text-gray-500 mt-1">New products and edits need approval before they go live.</p>
        </div>
        <Link href="/supplier/products/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Add product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-sm text-gray-400">
          You haven&rsquo;t added any products yet.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
          {products.map((p) => (
            <Link key={p.id} href={`/supplier/products/${p.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <span className={`text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status]}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{p.attraction.name}</p>
                {p.status === 'rejected' && p.rejectionReason ? (
                  <p className="text-[11px] text-red-500 mt-1 truncate">Reason: {p.rejectionReason}</p>
                ) : null}
              </div>
              <p className="text-sm font-medium whitespace-nowrap ml-4">{formatPrice(p.price, p.currency)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
