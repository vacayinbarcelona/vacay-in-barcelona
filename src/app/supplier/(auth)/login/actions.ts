'use server';

import { redirect } from 'next/navigation';
import { verifySupplierCredentials, setSupplierSessionCookie } from '@/lib/supplierAuth';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

export async function supplierLoginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase();
  const password = String(formData.get('password') ?? '');
  const captchaToken = formData.get('g-recaptcha-response') ? String(formData.get('g-recaptcha-response')) : null;

  if (isRateLimited(`supplier-login:${getClientIp()}`, 10, 10 * 60_000)) {
    redirect('/supplier/login?error=1');
  }

  if (!(await verifyRecaptcha(captchaToken))) {
    redirect('/supplier/login?error=captcha');
  }

  const supplier = await verifySupplierCredentials(email, password);
  if (!supplier) {
    redirect('/supplier/login?error=1');
  }

  await setSupplierSessionCookie(supplier.id);
  redirect('/supplier');
}
