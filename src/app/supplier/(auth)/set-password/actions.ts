'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { verifySupplierPasswordSetupToken, hashSupplierPassword, setSupplierSessionCookie } from '@/lib/supplierAuth';

export async function setSupplierPasswordAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  const parsed = verifySupplierPasswordSetupToken(token);
  if (!parsed) {
    redirect('/supplier/set-password?error=invalid-token');
  }

  if (password.length < 8) {
    redirect(`/supplier/set-password?token=${encodeURIComponent(token)}&error=weak`);
  }
  if (password !== confirmPassword) {
    redirect(`/supplier/set-password?token=${encodeURIComponent(token)}&error=mismatch`);
  }

  const supplier = await prisma.supplier.findUnique({ where: { id: parsed.supplierId } });
  if (!supplier || supplier.status !== 'approved') {
    redirect('/supplier/set-password?error=invalid-token');
  }

  const passwordHash = await hashSupplierPassword(password);
  await prisma.supplier.update({ where: { id: parsed.supplierId }, data: { passwordHash } });

  await setSupplierSessionCookie(parsed.supplierId);
  redirect('/supplier');
}
