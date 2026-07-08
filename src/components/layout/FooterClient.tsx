'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavLink = { href: string; label: string };

export function FooterClient({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <footer className="border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <p className="text-xs text-gray-500 leading-relaxed max-w-3xl mb-5">
          Vacay in Barcelona is an independent ticket and tour marketplace. We are not affiliated with, endorsed
          by, or the official website of any attraction listed. All bookings are processed securely on our own
          site.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-6">&copy; {new Date().getFullYear()} Vacay in Barcelona. All rights reserved.</p>
      </div>
    </footer>
  );
}
