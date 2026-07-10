'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

// Same pattern used for sign-up and the contact form — requires an @, a
// non-empty local/domain part, and an alphabetic TLD of 2+ letters.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Newsletter signup from the blog article page's CTA (see
// src/components/blog/NewsletterSignup.tsx). Minimal spam protection —
// honeypot + rate limit, same reasoning as the contact form: this is a low-
// stakes action (no email is sent out immediately), so it doesn't need a
// captcha, just enough friction to stop bulk scripted submissions.
export async function subscribeToNewsletter(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const redirectTo = String(formData.get('redirectTo') ?? '') || '/blog';

  // Hidden from real visitors, but simple bots that auto-fill every field
  // will fill this in too. Silently pretend success rather than revealing
  // the trap.
  const honeypot = String(formData.get('company') ?? '').trim();
  if (honeypot) {
    redirect(`${redirectTo}?subscribed=1`);
  }

  if (!EMAIL_PATTERN.test(email)) {
    redirect(`${redirectTo}?subscribeError=invalid-email`);
  }
  if (isRateLimited(`newsletter:${getClientIp()}`, 5, 10 * 60_000)) {
    redirect(`${redirectTo}?subscribeError=rate-limited`);
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email }
    });
  } catch (err) {
    console.error('Newsletter signup failed:', err);
    redirect(`${redirectTo}?subscribeError=1`);
  }

  redirect(`${redirectTo}?subscribed=1`);
}
