import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { supplierLogoutAction } from '@/app/supplier/actions';
import { formatSupplierId } from '@/lib/format';

const NAV = [
  { href: '/supplier', label: 'Dashboard' },
  { href: '/supplier/products', label: 'My products' }
];

export default async function SupplierDashboardLayout({ children }: { children: React.ReactNode }) {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <Link href="/supplier" className="font-semibold text-blue-700 text-sm">
            Vacay in Barcelona
          </Link>
          <p className="text-[11px] text-gray-400">Supplier panel</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 space-y-1">
          <p className="px-3 text-[11px] text-gray-400 mb-0.5 truncate">{supplier.companyName}</p>
          <p className="px-3 text-[10px] text-gray-400 truncate">{supplier.email}</p>
          <p className="px-3 text-[10px] font-mono text-gray-300 mb-1">{formatSupplierId(supplier.supplierNumber)}</p>
          <Link href="/" target="_blank" className="block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
            View site &rarr;
          </Link>
          <form action={supplierLogoutAction}>
            <button type="submit" className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50">
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
