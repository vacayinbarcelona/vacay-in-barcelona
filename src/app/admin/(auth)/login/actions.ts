'use server';

import { redirect } from 'next/navigation';
import { verifyCredentials, verifyAdminUserCredentials, setSessionCookie } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (verifyCredentials(email, password)) {
    await setSessionCookie(email, 'master');
    redirect('/admin');
  }

  const dbUser = await verifyAdminUserCredentials(email, password);
  if (dbUser) {
    await setSessionCookie(dbUser.email, dbUser.role);
    redirect(dbUser.role === 'master' ? '/admin' : '/admin/attractions');
  }

  redirect('/admin/login?error=1');
}
