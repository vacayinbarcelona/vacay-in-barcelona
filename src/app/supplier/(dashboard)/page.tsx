import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';

export default async function SupplierDashboardPage() {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');

  const [categories, products] = await Promise.all([
    prisma.supplierCategory.findMany({ where: { supplierId: supplier.id }, include: { attraction: { select: { name: true } } } }),
    prisma.ticketOption.findMany({ where: { supplierId: supplier.id }, select: { status: true } })
  ]);

  const counts = {
    pending_review: products.filter((p) => p.status === 'pending_review').length,
    published: products.filter((p) => p.status === 'published').length,
    rejected: products.filter((p) => p.status === 'rejected').length,
    disabled: products.filter((p) => p.status === 'disabled').length
  };

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Welcome, {supplier.companyName}</h1>
      <p className="text-base text-gray-500 mb-6">Manage your products in the categories you&rsquo;ve been assigned.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Published" value={counts.published} color="text-green-700" />
        <StatCard label="Pending review" value={counts.pending_review} color="text-amber-700" />
        <StatCard label="Rejected" value={counts.rejected} color="text-red-700" />
        <StatCard label="Disabled" value={counts.disabled} color="text-gray-500" />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <p className="text-base font-semibold mb-3">Your assigned categories</p>
        {categories.length === 0 ? (
          <p className="text-base text-gray-400">No categories assigned yet — contact the Vacay in Barcelona team.</p>
        ) : (
          <ul className="text-base text-gray-700 space-y-1.5">
            {categories.map((c) => (
              <li key={c.id}>{c.attraction.name}</li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/supplier/products/new" className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-base font-medium px-5 py-2.5 rounded-lg">
        + Add a new product
      </Link>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
