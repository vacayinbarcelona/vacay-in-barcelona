import { getCurrentUser } from '@/lib/customerAuth';
import { HeaderClient } from './HeaderClient';

// Server wrapper — reads the customer session (needs next/headers, so it
// can't run in the 'use client' HeaderClient) and passes down just the
// first name. All interactive bits (usePathname, cart badge) stay in
// HeaderClient.
export async function Header() {
  const user = await getCurrentUser();
  return <HeaderClient user={user ? { firstName: user.firstName } : null} />;
}
