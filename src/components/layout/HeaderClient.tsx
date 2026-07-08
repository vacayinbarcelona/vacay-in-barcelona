'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconCart } from '@/components/ui/Icons';
import { useCart } from '@/components/cart/CartProvider';

// Only pages that actually exist — keeps the header honest and uncluttered.
const NAV_LINKS = [
  { href: '/attractions/sagrada-familia', label: 'Sagrada Família' },
  { href: '/attractions/park-guell', label: 'Park Güell' },
  { href: '/attractions/flamenco-shows-barcelona', label: 'Flamenco Shows' }
];

type HeaderUser = { firstName: string } | null;

export function HeaderClient({ user }: { user: HeaderUser }) {
  // The admin panel (/admin/**) has its own sidebar chrome — it renders
  // under the same root layout as the public site, so the public
  // header/footer opt out here rather than requiring a second root layout.
  // Both hooks are called before the early return to keep hook order stable.
  const pathname = usePathname();
  const { itemCount } = useCart();
  if (pathname?.startsWith('/admin')) return null;

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-8">
        <Link href="/" className="flex-shrink-0">
          <Image src="/images/site/logo.png" alt="Vacay in Barcelona" width={1092} height={476} className="h-14 w-auto" priority />
        </Link>

        <div className="flex-1" />

        <nav className="hidden sm:flex items-center gap-5 text-sm text-gray-600 whitespace-nowrap">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-blue-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link href="/cart" className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100" aria-label="Cart">
          <IconCart className="h-5 w-5 text-gray-700" />
          {itemCount > 0 ? (
            <span className="absolute top-0.5 right-0.5 bg-blue-600 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
              {itemCount}
            </span>
          ) : null}
        </Link>

        {user ? (
          <Link
            href="/account"
            className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 whitespace-nowrap"
            aria-label="My account"
            title={user.firstName}
          >
            {user.firstName.charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link
            href="/account/sign-in"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full whitespace-nowrap"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
