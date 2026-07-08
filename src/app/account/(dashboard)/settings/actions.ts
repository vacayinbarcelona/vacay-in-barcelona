'use server';

import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/customerAuth';

export async function updateProfileAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/account/sign-in');
  }

  const firstName = String(formData.get('firstName') ?? '').trim();
  const lastName = String(formData.get('lastName') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const dobRaw = String(formData.get('dateOfBirth') ?? '').trim();

  if (!firstName || !lastName) {
    redirect('/account/settings?error=missing');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      firstName,
      lastName,
      phone,
      dateOfBirth: dobRaw ? new Date(dobRaw) : null
    }
  });

  redirect('/account/settings?saved=1');
}
