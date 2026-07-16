'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { uploadImageFile, hasUploadedFile } from '@/lib/upload';
import { readProductCoreFields, lines, EMAIL_PATTERN } from '@/lib/productForm';

// Product CRUD for the supplier panel — every create/edit here is scoped to
// the signed-in supplier's own products, and only within categories they've
// been granted access to (see SupplierCategory). Every save (new or edited)
// lands in status "pending_review" — a supplier can never publish directly;
// a Master Admin has to approve it first (see /admin/products/actions.ts).

async function requireSupplier() {
  const supplier = await getCurrentSupplier();
  if (!supplier) redirect('/supplier/login');
  return supplier;
}

async function assertCategoryAllowed(supplierId: string, attractionId: string) {
  const access = await prisma.supplierCategory.findUnique({
    where: { supplierId_attractionId: { supplierId, attractionId } }
  });
  return Boolean(access);
}

async function revalidateProduct(attractionSlug: string) {
  revalidatePath('/');
  revalidatePath(`/attractions/${attractionSlug}`);
}

// Supplier email/phone are mandatory on every supplier-created product (see
// ProductForm's requireContactInfo) — customers need a way to reach the
// operator directly about their specific booking. Checked again here since
// this is a server action; the `required` attribute alone isn't trustworthy.
function assertContactInfo(core: { supplierContactEmail: string; supplierContactPhone: string }, errorRedirectTo: string) {
  if (!core.supplierContactEmail || !core.supplierContactPhone) {
    redirect(`${errorRedirectTo}?error=missing-contact`);
  }
  if (!EMAIL_PATTERN.test(core.supplierContactEmail)) {
    redirect(`${errorRedirectTo}?error=invalid-contact-email`);
  }
}

export async function createSupplierProductAction(formData: FormData) {
  const supplier = await requireSupplier();

  const attractionId = String(formData.get('attractionId') ?? '');
  if (!attractionId || !(await assertCategoryAllowed(supplier.id, attractionId))) {
    redirect('/supplier/products/new?error=category');
  }

  const attraction = await prisma.attraction.findUnique({ where: { id: attractionId }, select: { slug: true } });
  if (!attraction) redirect('/supplier/products/new?error=category');

  const core = readProductCoreFields(formData);
  if (!core.name) redirect('/supplier/products/new?error=missing');
  assertContactInfo(core, '/supplier/products/new');

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  let meetingPointImage = '';
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      redirect(`/supplier/products/new?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  let photoUrl = '';
  if (hasUploadedFile(formData, 'photoFile')) {
    try {
      photoUrl = await uploadImageFile(formData.get('photoFile') as File, 'ticket-options/photos');
    } catch (err) {
      redirect(`/supplier/products/new?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  const product = await prisma.ticketOption.create({
    data: {
      attractionId,
      supplierId: supplier.id,
      status: 'pending_review',
      affiliateUrl: '',
      affiliateProvider: `Supplier: ${supplier.companyName}`,
      ...core,
      meetingPointImage,
      includedItems: {
        create: [
          ...included.map((text, i) => ({ text, included: true, sortOrder: i })),
          ...notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
        ]
      },
      infoItems: { create: beforeYouGo.map((text, i) => ({ text, sortOrder: i })) },
      images: photoUrl ? { create: [{ url: photoUrl, sortOrder: 0 }] } : undefined
    }
  });

  await revalidateProduct(attraction.slug);
  redirect(`/supplier/products?saved=${Date.now()}`);
  void product;
}

export async function updateSupplierProductAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();

  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing || existing.supplierId !== supplier.id) redirect('/supplier/products');

  const attractionId = String(formData.get('attractionId') ?? existing.attractionId);
  if (attractionId !== existing.attractionId && !(await assertCategoryAllowed(supplier.id, attractionId))) {
    redirect(`/supplier/products/${id}?error=category`);
  }

  const attraction = await prisma.attraction.findUnique({ where: { id: attractionId }, select: { slug: true } });
  if (!attraction) redirect(`/supplier/products/${id}?error=category`);

  const core = readProductCoreFields(formData);
  if (!core.name) redirect(`/supplier/products/${id}?error=missing`);
  assertContactInfo(core, `/supplier/products/${id}`);

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  let meetingPointImage = String(formData.get('existingMeetingPointImage') ?? '');
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      redirect(`/supplier/products/${id}?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  await prisma.$transaction([
    prisma.ticketOption.update({
      where: { id },
      data: {
        attractionId,
        ...core,
        meetingPointImage,
        // Any supplier edit needs a fresh look from the Master Admin —
        // publishing/keeping-published is their call, not the supplier's.
        status: 'pending_review',
        rejectionReason: ''
      }
    }),
    prisma.ticketIncludedItem.deleteMany({ where: { ticketOptionId: id } }),
    prisma.ticketIncludedItem.createMany({
      data: [
        ...included.map((text, i) => ({ ticketOptionId: id, text, included: true, sortOrder: i })),
        ...notIncluded.map((text, i) => ({ ticketOptionId: id, text, included: false, sortOrder: 100 + i }))
      ]
    }),
    prisma.ticketInfoItem.deleteMany({ where: { ticketOptionId: id } }),
    prisma.ticketInfoItem.createMany({
      data: beforeYouGo.map((text, i) => ({ ticketOptionId: id, text, sortOrder: i }))
    })
  ]);

  await revalidateProduct(existing.attraction.slug);
  if (attraction.slug !== existing.attraction.slug) await revalidateProduct(attraction.slug);
  redirect(`/supplier/products/${id}?saved=${Date.now()}`);
}

export async function deleteSupplierProductAction(id: string) {
  const supplier = await requireSupplier();

  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing || existing.supplierId !== supplier.id) redirect('/supplier/products');

  await prisma.ticketOption.delete({ where: { id } });
  await revalidateProduct(existing.attraction.slug);
  redirect(`/supplier/products?saved=${Date.now()}`);
}

export async function addSupplierProductImageAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing || existing.supplierId !== supplier.id) redirect('/supplier/products');

  if (!hasUploadedFile(formData, 'imageFile')) redirect(`/supplier/products/${id}`);

  let url = '';
  try {
    url = await uploadImageFile(formData.get('imageFile') as File, 'ticket-options/photos');
  } catch (err) {
    redirect(`/supplier/products/${id}?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
  }

  const count = await prisma.ticketOptionImage.count({ where: { ticketOptionId: id } });
  await prisma.ticketOptionImage.create({ data: { ticketOptionId: id, url, sortOrder: count } });
  await revalidateProduct(existing.attraction.slug);
  redirect(`/supplier/products/${id}?saved=${Date.now()}`);
}

export async function deleteSupplierProductImageAction(imageId: string, productId: string) {
  const supplier = await requireSupplier();
  const image = await prisma.ticketOptionImage.findUnique({
    where: { id: imageId },
    include: { ticketOption: { include: { attraction: { select: { slug: true } } } } }
  });
  if (!image || image.ticketOption.supplierId !== supplier.id) redirect('/supplier/products');

  await prisma.ticketOptionImage.delete({ where: { id: imageId } });
  await revalidateProduct(image.ticketOption.attraction.slug);
  redirect(`/supplier/products/${productId}?saved=${Date.now()}`);
}
