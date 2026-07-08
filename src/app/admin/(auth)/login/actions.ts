'use server';

import { redirect } from 'next/navigation';
import { verifyCredentials, verifyAdminUserCredentials, setSessionCookie } from '@/lib/auth';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  if (!(await verifyRecaptcha(captchaToken))) {
    redirect('/admin/login?error=captcha');
  }

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
