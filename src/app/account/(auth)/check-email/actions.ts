'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createEmailVerificationToken } from '@/lib/customerAuth';
import { sendVerificationEmail } from '@/lib/email';

export async function resendVerificationEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/account';

  const user = await prisma.user.findUnique({ where: { email } });

  // Only actually send if there's a real, not-yet-verified password
  // account — but redirect the same way either way, so this can't be used
  // to probe which email addresses have accounts.
  if (user && !user.emailVerified && user.passwordHash) {
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const token = createEmailVerificationToken(user.id);
    const verifyUrl = `${siteUrl}/account/verify-email?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;
    try {
      await sendVerificationEmail(user.email, user.firstName, verifyUrl);
    } catch (err) {
      console.error('Failed to resend verification email:', err);
    }
  }

  redirect(`/account/check-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}&resent=1`);
}
