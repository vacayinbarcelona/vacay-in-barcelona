'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword, setCustomerSessionCookie } from '@/lib/customerAuth';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function signUpAction(formData: FormData) {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/account';
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  if (!firstName || !lastName || !email || !password) {
    redirect(`/account/sign-up?error=missing&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (password.length < 8) {
    redirect(`/account/sign-up?error=weak&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!(await verifyRecaptcha(captchaToken))) {
    redirect(`/account/sign-up?error=captcha&redirect=${encodeURIComponent(redirectTo)}`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    redirect(`/account/sign-up?error=exists&redirect=${encodeURIComponent(redirectTo)}`);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName }
  });

  await setCustomerSessionCookie(user.id);
  redirect(redirectTo);
}
