import { getCurrentUser } from '@/lib/customerAuth';
import { prisma } from '@/lib/db';
import { HeaderClient } from './HeaderClient';

// Server wrapper — reads the customer session (needs next/headers, so it
// can't run in the 'use client' HeaderClient) and the admin-managed nav
// links, and passes both down. All interactive bits (usePathname, cart
// badge) stay in HeaderClient.
export async function Header() {
  const [user, navLinks] = await Promise.all([
    getCurrentUser(),
    prisma.navLink.findMany({ where: { location: 'header' }, orderBy: { sortOrder: 'asc' } })
  ]);

  return (
    <HeaderClient
      user={user ? { firstName: user.firstName } : null}
      navLinks={navLinks.map((link) => ({ href: link.href, label: link.label }))}
    />
  );
}
