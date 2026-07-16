'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';
import { capitalizeWords } from '@/lib/format';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// Public supplier application — same spam-protection layers as checkout
// (this one also results in the Master Admin reviewing a real application,
// so it gets the full honeypot + rate limit + captcha stack, not the lighter
// honeypot-only treatment used for the newsletter signup).
export async function submitSupplierApplication(formData: FormData) {
  // The form already capitalizes these live as the applicant types; this is
  // a server-side backstop in case JS is disabled or the request is crafted
  // directly.
  const companyName = capitalizeWords(String(formData.get('companyName') ?? '').trim());
  const contactName = capitalizeWords(String(formData.get('contactName') ?? '').trim());
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const phone = String(formData.get('phone') ?? '').trim();
  const website = String(formData.get('website') ?? '').trim();
  const taxId = String(formData.get('taxId') ?? '').trim();
  const registeredCountry = String(formData.get('registeredCountry') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();
  const termsAccepted = formData.get('termsAccepted') === 'on';
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  // Honeypot — hidden from real visitors, but simple bots that auto-fill
  // every field will fill this in too. Silently pretend success.
  const honeypot = String(formData.get('company') ?? '').trim();
  if (honeypot) {
    redirect('/become-a-supplier?submitted=1');
  }

  if (!companyName || !contactName || !email || !taxId || !registeredCountry) {
    redirect('/become-a-supplier?error=missing');
  }
  if (!termsAccepted) {
    redirect('/become-a-supplier?error=terms');
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

  const existingByEmail = await prisma.supplier.findUnique({ where: { email } });
  if (existingByEmail) {
    redirect('/become-a-supplier?error=exists-email');
  }

  // Case-insensitive — "Barcelona Tours SL" and "barcelona tours sl" should
  // count as the same company for this check.
  const existingByCompany = await prisma.supplier.findFirst({
    where: { companyName: { equals: companyName, mode: 'insensitive' } }
  });
  if (existingByCompany) {
    redirect('/become-a-supplier?error=exists-company');
  }

  // Categories are no longer picked by the applicant — the Master Admin
  // assigns them at approval time (see approveSupplierAction).
  await prisma.supplier.create({
    data: {
      companyName,
      contactName,
      email,
      phone,
      website,
      taxId,
      registeredCountry,
      message,
      status: 'pending',
      termsAcceptedAt: new Date()
    }
  });

  redirect('/become-a-supplier?submitted=1');
}
