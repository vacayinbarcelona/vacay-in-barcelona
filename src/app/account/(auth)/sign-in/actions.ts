'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { verifyPassword, setCustomerSessionCookie } from '@/lib/customerAuth';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/account';
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  if (!email || !password) {
    redirect(`/account/sign-in?error=1&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!(await verifyRecaptcha(captchaToken))) {
    redirect(`/account/sign-in?error=captcha&redirect=${encodeURIComponent(redirectTo)}`);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    redirect(`/account/sign-in?error=1&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!user.passwordHash) {
    // Account exists but was created via "Continue with Google" — it has
    // no password to check against.
    redirect(`/account/sign-in?error=google-only&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    redirect(`/account/sign-in?error=1&redirect=${encodeURIComponent(redirectTo)}`);
  }

  await setCustomerSessionCookie(user.id);
  redirect(redirectTo);
}
