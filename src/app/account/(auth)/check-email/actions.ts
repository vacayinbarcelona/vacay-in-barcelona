'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { createEmailVerificationToken } from '@/lib/customerAuth';
import { sendVerificationEmail } from '@/lib/email';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

const RESEND_COOLDOWN_MS = 60_000; // 60 seconds between resends per account

export async function resendVerificationEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/account';

  // Best-effort per-IP throttle first — cheap to check, blunts a bot
  // cycling through many target email addresses from one machine.
  const limited = isRateLimited(`resend-verify:${getClientIp()}`, 5, 10 * 60_000);

  if (!limited) {
    const user = await prisma.user.findUnique({ where: { email } });

    // Only actually send if there's a real, not-yet-verified password
    // account, AND the 60-second per-account cooldown has passed — but
    // redirect the same way regardless of any of this, so none of it can
    // be used to probe which email addresses have accounts or to detect
    // the cooldown itself.
    const onCooldown = user?.lastVerificationEmailSentAt && Date.now() - user.lastVerificationEmailSentAt.getTime() < RESEND_COOLDOWN_MS;

    if (user && !user.emailVerified && user.passwordHash && !onCooldown) {
      const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
      const token = createEmailVerificationToken(user.id);
      const verifyUrl = `${siteUrl}/account/verify-email?token=${token}&redirect=${encodeURIComponent(redirectTo)}`;
      try {
        await sendVerificationEmail(user.email, user.firstName, verifyUrl);
        await prisma.user.update({ where: { id: user.id }, data: { lastVerificationEmailSentAt: new Date() } });
      } catch (err) {
        console.error('Failed to resend verification email:', err);
      }
    }
  }

  redirect(`/account/check-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}&resent=1`);
}
