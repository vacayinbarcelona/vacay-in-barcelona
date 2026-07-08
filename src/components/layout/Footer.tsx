import { prisma } from '@/lib/db';
import { FooterClient } from './FooterClient';

// Server wrapper — fetches the admin-managed footer links (needs a DB
// call, so it can't run in the 'use client' FooterClient) and passes them
// down. The usePathname()-based admin opt-out stays in FooterClient.
export async function Footer() {
  const links = await prisma.navLink.findMany({ where: { location: 'footer' }, orderBy: { sortOrder: 'asc' } });
  return <FooterClient links={links.map((link) => ({ href: link.href, label: link.label }))} />;
}
