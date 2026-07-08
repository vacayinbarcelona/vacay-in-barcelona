'use server';

import { redirect } from 'next/navigation';
import { verifyCredentials, setSessionCookie } from '@/lib/auth';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!verifyCredentials(email, password)) {
    redirect('/admin/login?error=1');
  }

  await setSessionCookie(email);
  redirect('/admin');
}
