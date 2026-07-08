'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { hashPassword, createEmailVerificationToken } from '@/lib/customerAuth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { sendVerificationEmail } from '@/lib/email';

// Deliberately stricter than the bare minimum "has an @" check — requires
// a local part, an @, a domain with at least one dot, and a real
// alphabetic TLD of 2+ letters. Rejects plain text, symbols, and
// digit-only input like "12345" or "test" that type="email" alone would
// let through in some browsers.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export async function signUpAction(formData: FormData) {
  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/account';
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    redirect(`/account/sign-up?error=missing&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!EMAIL_PATTERN.test(email)) {
    redirect(`/account/sign-up?error=invalid-email&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (password.length < 8) {
    redirect(`/account/sign-up?error=weak&redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (password !== confirmPassword) {
    redirect(`/account/sign-up?error=mismatch&redirect=${encodeURIComponent(redirectTo)}`);
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
    data: { email, passwordHash, firstName, lastName, emailVerified: false }
  });

  // Not signed in yet — they need to confirm their email first (see
  // /account/verify-email). Google sign-in skips all of this.
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const token = createEmailVerificationToken(user.id);
  const verifyUrl = `${siteUrl}/account/verify-email?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;

  try {
    await sendVerificationEmail(user.email, user.firstName, verifyUrl);
  } catch (err) {
    console.error('Sign-up succeeded but verification email failed to send:', err);
  }

  redirect(`/account/check-email?email=${encodeURIComponent(user.email)}&redirect=${encodeURIComponent(redirectTo)}`);
}
