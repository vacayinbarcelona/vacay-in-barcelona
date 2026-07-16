'use server';

import { redirect } from 'next/navigation';
import { clearSupplierSessionCookie } from '@/lib/supplierAuth';

export async function supplierLogoutAction() {
  await clearSupplierSessionCookie();
  redirect('/supplier/login');
}
