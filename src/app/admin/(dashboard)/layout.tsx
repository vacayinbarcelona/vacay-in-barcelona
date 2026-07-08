import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { logoutAction } from '@/app/admin/actions';

const NAV = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/attractions', label: 'Attractions & tours' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/seo', label: 'SEO' }
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/admin/login');

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-60 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <Link href="/admin" className="font-semibold text-blue-700 text-sm">
            Vacay in Barcelona
          </Link>
          <p className="text-[11px] text-gray-400">Admin panel</p>
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
          <p className="px-3 text-[11px] text-gray-400 mb-1 truncate">{session.email}</p>
          <Link href="/" target="_blank" className="block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100">
            View site &rarr;
          </Link>
          <form action={logoutAction}>
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
