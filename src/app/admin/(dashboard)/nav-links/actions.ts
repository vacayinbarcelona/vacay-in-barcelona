'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';

// Admin-managed header/footer links. Every mutation revalidates the whole
// site (via the shared root layout) since Header/Footer render on every
// page.

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function revalidateNav() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/nav-links');
}

export async function createNavLink(formData: FormData) {
  const location = str(formData, 'location') === 'footer' ? 'footer' : 'header';
  const label = str(formData, 'label');
  const href = str(formData, 'href');

  if (!label || !href) {
    redirect('/admin/nav-links?error=missing');
  }

  const highest = await prisma.navLink.findFirst({
    where: { location },
    orderBy: { sortOrder: 'desc' }
  });

  await prisma.navLink.create({
    data: {
      location,
      label,
      href,
      sortOrder: (highest?.sortOrder ?? -1) + 1
    }
  });

  revalidateNav();
  redirect('/admin/nav-links?saved=1');
}

export async function deleteNavLink(id: string) {
  await prisma.navLink.delete({ where: { id } });
  revalidateNav();
  redirect('/admin/nav-links?saved=1');
}
