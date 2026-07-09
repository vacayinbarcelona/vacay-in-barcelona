'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession, hashAdminPassword } from '@/lib/auth';

async function requireMaster() {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/attractions');
  return session;
}

export async function createAdminUser(formData: FormData) {
  await requireMaster();

  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const role = String(formData.get('role') ?? '') === 'master' ? 'master' : 'editor';

  if (!email || !password) {
    redirect('/admin/team?error=missing');
  }
  if (password.length < 8) {
    redirect('/admin/team?error=weak');
  }
  if (email === (process.env.ADMIN_EMAIL ?? '').toLowerCase()) {
    redirect('/admin/team?error=exists');
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    redirect('/admin/team?error=exists');
  }

  const passwordHash = await hashAdminPassword(password);
  await prisma.adminUser.create({ data: { email, passwordHash, role } });

  revalidatePath('/admin/team');
  redirect(`/admin/team?saved=${Date.now()}`);
}

export async function deleteAdminUser(id: string) {
  const session = await requireMaster();

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (user && user.email.toLowerCase() === session.email.toLowerCase()) {
    // Don't let a master accidentally remove their own DB-backed account
    // mid-session — sign out and delete it from another admin's session
    // instead if that's really the goal.
    redirect('/admin/team?error=self');
  }

  await prisma.adminUser.delete({ where: { id } });
  revalidatePath('/admin/team');
  redirect(`/admin/team?saved=${Date.now()}`);
}
