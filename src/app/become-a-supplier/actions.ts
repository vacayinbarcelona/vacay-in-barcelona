'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Public supplier application — same spam-protection layers as checkout
// (this one also results in the Master Admin reviewing a real application,
// so it gets the full honeypot + rate limit + captcha stack, not the lighter
// honeypot-only treatment used for the newsletter signup).
export async function submitSupplierApplication(formData: FormData) {
  const companyName = String(formData.get('companyName') ?? '').trim();
  const contactName = String(formData.get('contactName') ?? '').trim();
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean);
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  // Honeypot — hidden from real visitors, but simple bots that auto-fill
  // every field will fill this in too. Silently pretend success.
  const honeypot = String(formData.get('company') ?? '').trim();
  if (honeypot) {
    redirect('/become-a-supplier?submitted=1');
  }

  if (!companyName || !contactName || !email || categoryIds.length === 0) {
    redirect('/become-a-supplier?error=missing');
  }
  if (!EMAIL_PATTERN.test(email)) {
    redirect('/become-a-supplier?error=invalid-email');
  }
  if (isRateLimited(`supplier-apply:${getClientIp()}`, 5, 10 * 60_000)) {
    redirect('/become-a-supplier?error=rate-limited');
  }
  if (!(await verifyRecaptcha(captchaToken))) {
    redirect('/become-a-supplier?error=captcha');
  }

  const existing = await prisma.supplier.findUnique({ where: { email } });
  if (existing) {
    redirect('/become-a-supplier?error=exists');
  }

  // Only offer categories that actually exist — a crafted request with a
  // stale/invalid attraction id shouldn't create a dangling SupplierCategory
  // row.
  const validAttractions = await prisma.attraction.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true }
  });
  const validIds = validAttractions.map((a) => a.id);
  if (validIds.length === 0) {
    redirect('/become-a-supplier?error=missing');
  }

  await prisma.supplier.create({
    data: {
      companyName,
      contactName,
      email,
      phone,
      website,
      message,
      status: 'pending',
      categories: { create: validIds.map((attractionId) => ({ attractionId })) }
    }
  });

  redirect('/become-a-supplier?submitted=1');
}
