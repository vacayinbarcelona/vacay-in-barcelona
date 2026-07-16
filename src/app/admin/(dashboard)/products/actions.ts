'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { uploadImageFile, hasUploadedFile } from '@/lib/upload';
import { readProductCoreFields, lines, str } from '@/lib/productForm';
import { parseAvailabilityJson, validateAvailabilitySchedules, draftToPrismaCreate } from '@/lib/availabilitySchedule';

// Master Admin's central products dashboard — covers both "house" products
// (created directly here, supplierId null, published immediately) and
// moderating supplier-submitted products (approve/reject/disable). Master-
// only, same tier as /admin/suppliers and /admin/bookings — editors keep
// using the existing inline ticket-option editor on each attraction's page
// for house-product content, unchanged.

async function requireMaster() {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin');
}

async function revalidateProduct(attractionSlug: string) {
  revalidatePath('/');
  revalidatePath(`/attractions/${attractionSlug}`);
}

export async function createAdminProductAction(formData: FormData) {
  await requireMaster();

  const attractionId = String(formData.get('attractionId') ?? '');
  const attraction = attractionId ? await prisma.attraction.findUnique({ where: { id: attractionId }, select: { slug: true } }) : null;
  if (!attraction) redirect('/admin/products/new?error=category');

  const core = readProductCoreFields(formData);
  if (!core.name) redirect('/admin/products/new?error=missing');

  const availabilitySchedules = parseAvailabilityJson(str(formData, 'availabilityJson'));
  const availabilityError = validateAvailabilitySchedules(availabilitySchedules);
  if (availabilityError) redirect(`/admin/products/new?error=${encodeURIComponent(availabilityError)}`);

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  let meetingPointImage = '';
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      redirect(`/admin/products/new?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  let photoUrl = '';
  if (hasUploadedFile(formData, 'photoFile')) {
    try {
      photoUrl = await uploadImageFile(formData.get('photoFile') as File, 'ticket-options/photos');
    } catch (err) {
      redirect(`/admin/products/new?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  const product = await prisma.ticketOption.create({
    data: {
      attractionId,
      supplierId: null,
      status: 'published',
      affiliateUrl: '',
      affiliateProvider: 'Direct (Rezdy)',
      ...core,
      meetingPointImage,
      includedItems: {
        create: [
          ...included.map((text, i) => ({ text, included: true, sortOrder: i })),
          ...notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
        ]
      },
      infoItems: { create: beforeYouGo.map((text, i) => ({ text, sortOrder: i })) },
      images: photoUrl ? { create: [{ url: photoUrl, sortOrder: 0 }] } : undefined,
      languageSchedules: { create: draftToPrismaCreate(availabilitySchedules) }
    }
  });

  await revalidateProduct(attraction.slug);
  redirect(`/admin/products/${product.id}?saved=${Date.now()}`);
}

export async function updateAdminProductAction(id: string, formData: FormData) {
  await requireMaster();

  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing) redirect('/admin/products');

  const attractionId = String(formData.get('attractionId') ?? existing.attractionId);
  const attraction = await prisma.attraction.findUnique({ where: { id: attractionId }, select: { slug: true } });
  if (!attraction) redirect(`/admin/products/${id}?error=category`);

  const core = readProductCoreFields(formData);
  if (!core.name) redirect(`/admin/products/${id}?error=missing`);

  const availabilitySchedules = parseAvailabilityJson(str(formData, 'availabilityJson'));
  const availabilityError = validateAvailabilitySchedules(availabilitySchedules);
  if (availabilityError) redirect(`/admin/products/${id}?error=${encodeURIComponent(availabilityError)}`);

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  let meetingPointImage = String(formData.get('existingMeetingPointImage') ?? '');
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      redirect(`/admin/products/${id}?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  await prisma.$transaction([
    // Delete-then-recreate the whole availability tree — same convention as
    // included/not-included and before-you-go below. Cascades to slots and
    // ticket types at the DB level (onDelete: Cascade), so this one call
    // clears the entire nested structure for this product.
    prisma.ticketOptionLanguageSchedule.deleteMany({ where: { ticketOptionId: id } }),
    // Deliberately doesn't touch `status` — publish/reject/disable are
    // separate explicit actions below, kept independent from editing content
    // so saving a correction doesn't accidentally change moderation state.
    prisma.ticketOption.update({
      where: { id },
      data: {
        attractionId,
        ...core,
        meetingPointImage,
        languageSchedules: { create: draftToPrismaCreate(availabilitySchedules) }
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
  redirect(`/admin/products/${id}?saved=${Date.now()}`);
}

export async function deleteAdminProductAction(id: string) {
  await requireMaster();
  const existing = await prisma.ticketOption.findUnique({ where: { id }, select: { attraction: { select: { slug: true } } } });
  await prisma.ticketOption.delete({ where: { id } });
  if (existing) await revalidateProduct(existing.attraction.slug);
  redirect('/admin/products');
}

// ---------------------------------------------------------------------------
// Moderation — approve/reject a supplier submission, disable/republish any
// product (house or supplier).
// ---------------------------------------------------------------------------

async function setProductStatus(id: string, status: string, rejectionReason = '') {
  await requireMaster();
  const product = await prisma.ticketOption.update({
    where: { id },
    data: { status, rejectionReason },
    include: { attraction: { select: { slug: true } } }
  });
  await revalidateProduct(product.attraction.slug);
}

export async function approveProductAction(id: string) {
  await setProductStatus(id, 'published');
  revalidatePath('/admin/products');
  redirect(`/admin/products?saved=${Date.now()}`);
}

export async function rejectProductAction(id: string, formData: FormData) {
  await setProductStatus(id, 'rejected', str(formData, 'rejectionReason'));
  revalidatePath('/admin/products');
  redirect(`/admin/products?saved=${Date.now()}`);
}

export async function disableProductAction(id: string) {
  await setProductStatus(id, 'disabled');
  revalidatePath('/admin/products');
  redirect(`/admin/products?saved=${Date.now()}`);
}

export async function republishProductAction(id: string) {
  await setProductStatus(id, 'published');
  revalidatePath('/admin/products');
  redirect(`/admin/products?saved=${Date.now()}`);
}

export async function addAdminProductImageAction(id: string, formData: FormData) {
  await requireMaster();
  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing) redirect('/admin/products');

  if (!hasUploadedFile(formData, 'imageFile')) redirect(`/admin/products/${id}`);

  let url = '';
  try {
    url = await uploadImageFile(formData.get('imageFile') as File, 'ticket-options/photos');
  } catch (err) {
    redirect(`/admin/products/${id}?error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
  }

  const count = await prisma.ticketOptionImage.count({ where: { ticketOptionId: id } });
  await prisma.ticketOptionImage.create({ data: { ticketOptionId: id, url, sortOrder: count } });
  await revalidateProduct(existing.attraction.slug);
  redirect(`/admin/products/${id}?saved=${Date.now()}`);
}

export async function deleteAdminProductImageAction(imageId: string, productId: string) {
  await requireMaster();
  const image = await prisma.ticketOptionImage.findUnique({
    where: { id: imageId },
    include: { ticketOption: { include: { attraction: { select: { slug: true } } } } }
  });
  if (!image) redirect(`/admin/products/${productId}`);

  await prisma.ticketOptionImage.delete({ where: { id: imageId } });
  await revalidateProduct(image.ticketOption.attraction.slug);
  redirect(`/admin/products/${productId}?saved=${Date.now()}`);
}
