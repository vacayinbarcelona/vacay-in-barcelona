'use server';

import { redirect } from 'next/navigation';
import { clearCustomerSessionCookie } from '@/lib/customerAuth';

export async function signOutAction() {
  await clearCustomerSessionCookie();
  redirect('/');
}
