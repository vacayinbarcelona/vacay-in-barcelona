import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/customerAuth';
import { signOutAction } from '../actions';

// Guards every page under /account (dashboard) — bounces signed-out
// visitors to sign-in. The (auth) route group (sign-up/sign-in) sits
// outside this layout so it stays reachable while signed out.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/account/sign-in');
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs text-gray-400 mb-1">My account</p>
          <h1 className="text-xl font-semibold">Hi, {user.firstName}</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/account" className="text-gray-600 hover:text-blue-700">
            Overview
          </Link>
          <Link href="/account/orders" className="text-gray-600 hover:text-blue-700">
            My bookings
          </Link>
          <Link href="/account/settings" className="text-gray-600 hover:text-blue-700">
            Settings
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="text-gray-600 hover:text-blue-700">
              Sign out
            </button>
          </form>
        </nav>
      </div>
      {children}
    </div>
  );
}
