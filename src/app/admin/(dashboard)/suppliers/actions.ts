'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createSupplierPasswordSetupToken } from '@/lib/supplierAuth';
import { sendSupplierApprovedEmail, sendSupplierRejectedEmail } from '@/lib/email';

// Supplier review & management — master-only (same sensitivity tier as
// /admin/team and /admin/bookings). Editors can manage attraction/blog
// content but not suppliers.
async function requireMaster() {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

async function replaceSupplierCategories(supplierId: string, attractionIds: string[]) {
  await prisma.$transaction([
    prisma.supplierCategory.deleteMany({ where: { supplierId } }),
    prisma.supplierCategory.createMany({
      data: attractionIds.map((attractionId) => ({ supplierId, attractionId }))
    })
  ]);
}

export async function approveSupplierAction(id: string, formData: FormData) {
  await requireMaster();

  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean);
  if (categoryIds.length === 0) {
    redirect(`/admin/suppliers/${id}?error=no-categories`);
  }

  const validAttractions = await prisma.attraction.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } });
  if (validAttractions.length === 0) {
    redirect(`/admin/suppliers/${id}?error=no-categories`);
  }

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { status: 'approved', reviewedAt: new Date(), rejectionReason: '' }
  });
  await replaceSupplierCategories(id, validAttractions.map((a) => a.id));

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const token = createSupplierPasswordSetupToken(id);
  const setPasswordUrl = `${siteUrl}/supplier/set-password?token=${token}`;

  try {
    await sendSupplierApprovedEmail(supplier.email, supplier.contactName, supplier.companyName, setPasswordUrl, validAttractions.map((a) => a.name));
  } catch (err) {
    console.error('Supplier approved but approval email failed to send:', err);
  }

  revalidatePath('/admin/suppliers');
  redirect(`/admin/suppliers/${id}?saved=${Date.now()}`);
}

export async function rejectSupplierAction(id: string, formData: FormData) {
  await requireMaster();

  const rejectionReason = str(formData, 'rejectionReason');

  const supplier = await prisma.supplier.update({
    where: { id },
    data: { status: 'rejected', reviewedAt: new Date(), rejectionReason }
  });

  try {
    await sendSupplierRejectedEmail(supplier.email, supplier.contactName, supplier.companyName, rejectionReason);
  } catch (err) {
    console.error('Supplier rejected but rejection email failed to send:', err);
  }

  revalidatePath('/admin/suppliers');
  redirect(`/admin/suppliers/${id}?saved=${Date.now()}`);
}

// For an already-approved supplier — adjust which categories they can
// manage products under, any time after approval, without re-sending the
// approval email.
export async function updateSupplierCategoriesAction(id: string, formData: FormData) {
  await requireMaster();

  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean);
  const validAttractions = await prisma.attraction.findMany({ where: { id: { in: categoryIds } }, select: { id: true } });
  await replaceSupplierCategories(id, validAttractions.map((a) => a.id));

  revalidatePath('/admin/suppliers');
  redirect(`/admin/suppliers/${id}?saved=${Date.now()}`);
}

// Disable blocks supplier login and hides every one of their products from
// the public site (see the status filter added to the attraction page
// query) without deleting their application/product history. Re-enable
// reverses it.
export async function setSupplierAccountStatusAction(id: string, status: 'approved' | 'disabled') {
  await requireMaster();
  await prisma.supplier.update({ where: { id }, data: { status } });
  revalidatePath('/admin/suppliers');
  redirect(`/admin/suppliers/${id}?saved=${Date.now()}`);
}
