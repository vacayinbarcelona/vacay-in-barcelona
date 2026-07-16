'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getCurrentSupplier } from '@/lib/supplierAuth';
import { uploadImageFile, hasUploadedFile } from '@/lib/upload';
import { str, num, bool, lines, EMAIL_PATTERN } from '@/lib/productForm';
import { parseAvailabilityJson, validateAvailabilitySchedules, draftToPrismaCreate, type LanguageScheduleDraft } from '@/lib/availabilitySchedule';

// Product CRUD for the supplier panel — split into a 3-step wizard (see
// src/components/products/wizard/): Step 1 (basic product info + photos),
// Step 2 (meeting point + supplier contact), Step 3 (availability &
// pricing). Each step is its own <form> that saves only the fields it owns,
// so navigating between steps (or leaving and coming back later) never
// touches — let alone wipes — data entered on a different step.
//
// A brand-new product is created the moment Step 1 is first saved, with
// status "draft" — it does NOT go to the Master Admin for review yet. It
// only becomes "pending_review" when the supplier explicitly clicks
// "Publish Product" on Step 3 (see step3PublishAction), which also
// re-validates every step's required fields regardless of how the supplier
// got there (Save as Draft / Previous never block on validation, so gaps
// are only caught for real at the point of actually publishing).
//
// Editing an already-submitted product (status other than "draft") through
// this same wizard behaves the same way: Save as Draft / Next / Previous
// save progress without resetting its review status, and only "Publish
// Product" resubmits it to the Master Admin — this lets a supplier make a
// multi-step edit without spamming the review queue on every intermediate
// save, whereas previously every single save immediately reset the product
// to "pending_review".

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

async function requireOwnedProduct(supplier: { id: string }, id: string) {
  const product = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!product || product.supplierId !== supplier.id) redirect('/supplier/products');
  return product;
}

function uploadedFiles(formData: FormData, key: string): File[] {
  return formData
    .getAll(key)
    .filter((v): v is File => v instanceof File && v.size > 0 && v.name !== '');
}

function wizardPath(id: string | null, step: 1 | 2 | 3): string {
  return id ? `/supplier/products/${id}?step=${step}` : '/supplier/products/new';
}

// ---------------------------------------------------------------------------
// Step 1 — Basic product information (category, title, description,
// included/not included/before you go, photos) plus the handful of existing
// fields that aren't part of any of the 3 named steps (price, currency,
// duration, cancellation policy, group type, the 3 feature checkboxes) —
// kept here rather than dropped, since removing them would silently blank
// out real data. Photos are additive only (newly selected files are
// uploaded and appended to the gallery); removing a photo is its own tiny
// action (deleteSupplierProductImageAction) shown next to each thumbnail.
// ---------------------------------------------------------------------------

async function writeStep1(supplier: { id: string; companyName: string }, id: string | null, formData: FormData): Promise<string> {
  const attractionId = str(formData, 'attractionId');
  if (!attractionId || !(await assertCategoryAllowed(supplier.id, attractionId))) {
    redirect(`${wizardPath(id, 1)}${id ? '&' : '?'}error=category`);
  }

  const fields = {
    attractionId,
    name: str(formData, 'name'),
    description: str(formData, 'description'),
    price: num(formData, 'price', 0),
    currency: str(formData, 'currency') || 'EUR',
    durationLabel: str(formData, 'durationLabel'),
    freeCancellation: bool(formData, 'freeCancellation'),
    mobileTicket: bool(formData, 'mobileTicket'),
    instantConfirmation: bool(formData, 'instantConfirmation'),
    cancellationPolicy: str(formData, 'cancellationPolicy'),
    groupType: str(formData, 'groupType')
  };

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  const newPhotos: { url: string; sortOrder: number }[] = [];
  const files = uploadedFiles(formData, 'photoFiles');
  if (files.length > 0) {
    let nextSortOrder = id ? await prisma.ticketOptionImage.count({ where: { ticketOptionId: id } }) : 0;
    for (const file of files) {
      try {
        const url = await uploadImageFile(file, 'ticket-options/photos');
        newPhotos.push({ url, sortOrder: nextSortOrder });
        nextSortOrder += 1;
      } catch (err) {
        redirect(`${wizardPath(id, 1)}${id ? '&' : '?'}error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
      }
    }
  }

  if (id) {
    const existing = await requireOwnedProduct(supplier, id);
    const updated = await prisma.ticketOption.update({
      where: { id },
      data: {
        ...fields,
        includedItems: {
          deleteMany: {},
          create: [
            ...included.map((text, i) => ({ text, included: true, sortOrder: i })),
            ...notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
          ]
        },
        infoItems: { deleteMany: {}, create: beforeYouGo.map((text, i) => ({ text, sortOrder: i })) },
        images: newPhotos.length > 0 ? { create: newPhotos } : undefined
      },
      include: { attraction: { select: { slug: true } } }
    });
    await revalidateProduct(existing.attraction.slug);
    if (updated.attraction.slug !== existing.attraction.slug) await revalidateProduct(updated.attraction.slug);
    return id;
  }

  const attraction = await prisma.attraction.findUnique({ where: { id: attractionId }, select: { slug: true } });
  if (!attraction) redirect(`${wizardPath(id, 1)}?error=category`);

  const created = await prisma.ticketOption.create({
    data: {
      ...fields,
      supplierId: supplier.id,
      status: 'draft',
      affiliateUrl: '',
      affiliateProvider: `Supplier: ${supplier.companyName}`,
      includedItems: {
        create: [
          ...included.map((text, i) => ({ text, included: true, sortOrder: i })),
          ...notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
        ]
      },
      infoItems: { create: beforeYouGo.map((text, i) => ({ text, sortOrder: i })) },
      images: newPhotos.length > 0 ? { create: newPhotos } : undefined
    }
  });

  await revalidateProduct(attraction.slug);
  return created.id;
}

export async function step1SaveAndListAction(id: string | null, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep1(supplier, id, formData);
  redirect(`/supplier/products?saved=${Date.now()}`);
}

export async function step1SaveAndNextAction(id: string | null, formData: FormData) {
  const supplier = await requireSupplier();
  if (!str(formData, 'name')) redirect(`${wizardPath(id, 1)}${id ? '&' : '?'}error=missing`);
  const newId = await writeStep1(supplier, id, formData);
  redirect(`/supplier/products/${newId}?step=2`);
}

// ---------------------------------------------------------------------------
// Step 2 — Meeting point + supplier contact info. Only reachable for a
// product that already exists (Step 1 always creates it first).
// ---------------------------------------------------------------------------

async function writeStep2(supplier: { id: string }, id: string, formData: FormData): Promise<void> {
  const existing = await requireOwnedProduct(supplier, id);

  let meetingPointImage = str(formData, 'existingMeetingPointImage') || existing.meetingPointImage;
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      redirect(`/supplier/products/${id}?step=2&error=${encodeURIComponent(err instanceof Error ? err.message : 'Image upload failed.')}`);
    }
  }

  await prisma.ticketOption.update({
    where: { id },
    data: {
      meetingPointAddress: str(formData, 'meetingPointAddress'),
      meetingPoint: str(formData, 'meetingPoint'),
      meetingPointImage,
      supplierContactName: str(formData, 'supplierContactName'),
      supplierContactEmail: str(formData, 'supplierContactEmail').toLowerCase(),
      supplierContactPhone: str(formData, 'supplierContactPhone')
    }
  });
  await revalidateProduct(existing.attraction.slug);
}

export async function step2SaveAndListAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep2(supplier, id, formData);
  redirect(`/supplier/products?saved=${Date.now()}`);
}

export async function step2SaveAndPreviousAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep2(supplier, id, formData);
  redirect(`/supplier/products/${id}?step=1`);
}

export async function step2SaveAndNextAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep2(supplier, id, formData);
  const email = str(formData, 'supplierContactEmail');
  const phone = str(formData, 'supplierContactPhone');
  if (!email || !phone) redirect(`/supplier/products/${id}?step=2&error=missing-contact`);
  if (!EMAIL_PATTERN.test(email)) redirect(`/supplier/products/${id}?step=2&error=invalid-contact-email`);
  redirect(`/supplier/products/${id}?step=3`);
}

// ---------------------------------------------------------------------------
// Step 3 — Availability & pricing (the full AvailabilityScheduleEditor tree)
// plus the final Publish action, which is the only thing in this whole
// wizard that actually submits the product to the Master Admin for review.
// ---------------------------------------------------------------------------

async function writeStep3(supplier: { id: string }, id: string, formData: FormData): Promise<LanguageScheduleDraft[]> {
  const existing = await requireOwnedProduct(supplier, id);

  const schedules = parseAvailabilityJson(str(formData, 'availabilityJson'));
  const structuralError = validateAvailabilitySchedules(schedules);
  if (structuralError) redirect(`/supplier/products/${id}?step=3&error=${encodeURIComponent(structuralError)}`);

  await prisma.$transaction([
    prisma.ticketOptionLanguageSchedule.deleteMany({ where: { ticketOptionId: id } }),
    prisma.ticketOption.update({ where: { id }, data: { languageSchedules: { create: draftToPrismaCreate(schedules) } } })
  ]);
  await revalidateProduct(existing.attraction.slug);

  return schedules;
}

export async function step3SaveAndPreviousAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep3(supplier, id, formData);
  redirect(`/supplier/products/${id}?step=2`);
}

export async function step3SaveAsDraftAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  await writeStep3(supplier, id, formData);
  redirect(`/supplier/products?saved=${Date.now()}`);
}

export async function step3PublishAction(id: string, formData: FormData) {
  const supplier = await requireSupplier();
  const schedules = await writeStep3(supplier, id, formData);

  // Comprehensive re-check across every step's required fields — Save as
  // Draft/Previous never block on validation, so this is the one place a
  // gap left on an earlier step is actually caught, right before the
  // product is submitted to the Master Admin for review.
  const product = await requireOwnedProduct(supplier, id);
  if (!product.name) redirect(`/supplier/products/${id}?step=1&error=missing`);
  if (!product.supplierContactEmail || !product.supplierContactPhone) {
    redirect(`/supplier/products/${id}?step=2&error=missing-contact`);
  }
  if (schedules.length === 0) {
    redirect(`/supplier/products/${id}?step=3&error=${encodeURIComponent('Add at least one language’s availability before publishing.')}`);
  }

  await prisma.ticketOption.update({ where: { id }, data: { status: 'pending_review', rejectionReason: '' } });
  await revalidateProduct(product.attraction.slug);
  redirect(`/supplier/products?saved=${Date.now()}`);
}

// ---------------------------------------------------------------------------
// Delete product / delete a single photo — unchanged from before, work
// regardless of which wizard step the product happens to be sitting at.
// ---------------------------------------------------------------------------

export async function deleteSupplierProductAction(id: string) {
  const supplier = await requireSupplier();

  const existing = await prisma.ticketOption.findUnique({ where: { id }, include: { attraction: { select: { slug: true } } } });
  if (!existing || existing.supplierId !== supplier.id) redirect('/supplier/products');

  await prisma.ticketOption.delete({ where: { id } });
  await revalidateProduct(existing.attraction.slug);
  redirect(`/supplier/products?saved=${Date.now()}`);
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
  redirect(`/supplier/products/${productId}?step=1&saved=${Date.now()}`);
}
