'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slugify';
import { getSession } from '@/lib/auth';
import { uploadImageFile, hasUploadedFile } from '@/lib/upload';

// All admin CRUD for attractions and their related content (ticket options,
// highlights, included/excluded items, important info, FAQs, images,
// reviews). Every mutation revalidates the public homepage and the
// attraction's own page so edits show up immediately without a redeploy.

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

function bool(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on';
}

function lines(formData: FormData, key: string): string[] {
  return str(formData, key)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

async function revalidateAttraction(slug: string) {
  revalidatePath('/');
  revalidatePath(`/attractions/${slug}`);
  revalidatePath('/admin/attractions');
}

// ---------------------------------------------------------------------------
// Core attraction record
// ---------------------------------------------------------------------------

export async function createAttraction(formData: FormData) {
  const name = str(formData, 'name');
  const slugInput = str(formData, 'slug');
  const slug = slugify(slugInput || name);

  if (!name || !slug) return;

  let heroImageUrl = '';
  if (hasUploadedFile(formData, 'heroImageFile')) {
    try {
      heroImageUrl = await uploadImageFile(formData.get('heroImageFile') as File, 'attractions/hero');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed.';
      redirect(`/admin/attractions/new?error=${encodeURIComponent(message)}`);
    }
  }

  await prisma.attraction.create({
    data: {
      slug,
      name,
      category: str(formData, 'category') || 'attraction',
      categoryLabel: str(formData, 'categoryLabel'),
      status: str(formData, 'status') || 'draft',
      badge: str(formData, 'badge'),
      tagline: str(formData, 'tagline'),
      shortDescription: str(formData, 'shortDescription'),
      longDescription: str(formData, 'longDescription'),
      heroImageUrl,
      heroImageAlt: str(formData, 'heroImageAlt'),
      rating: num(formData, 'rating', 4.5),
      reviewCount: num(formData, 'reviewCount', 0),
      priceFrom: num(formData, 'priceFrom', 0),
      currency: str(formData, 'currency') || 'EUR',
      durationLabel: str(formData, 'durationLabel'),
      freeCancellation: bool(formData, 'freeCancellation'),
      mobileTicket: bool(formData, 'mobileTicket'),
      requiresAllTravelerNames: bool(formData, 'requiresAllTravelerNames'),
      address: str(formData, 'address'),
      mapUrl: str(formData, 'mapUrl'),
      featured: bool(formData, 'featured'),
      popularTour: bool(formData, 'popularTour'),
      sortOrder: num(formData, 'sortOrder', 0),
      metaTitle: str(formData, 'metaTitle'),
      metaDescription: str(formData, 'metaDescription')
    }
  });

  revalidatePath('/');
  revalidatePath('/admin/attractions');
  redirect(`/admin/attractions/${slug}`);
}

export async function updateAttraction(id: string, currentSlug: string, formData: FormData) {
  const name = str(formData, 'name');
  const slugInput = str(formData, 'slug');
  const slug = slugify(slugInput || name) || currentSlug;

  // Keep the current hero photo unless the admin picked a new file — the
  // hidden "existingHeroImageUrl" input (see [slug]/page.tsx) carries the
  // current URL forward, same pattern as the ticket option meeting point
  // image.
  let heroImageUrl = str(formData, 'existingHeroImageUrl');
  if (hasUploadedFile(formData, 'heroImageFile')) {
    try {
      heroImageUrl = await uploadImageFile(formData.get('heroImageFile') as File, 'attractions/hero');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed.';
      redirect(`/admin/attractions/${currentSlug}?error=${encodeURIComponent(message)}#content`);
    }
  }

  await prisma.attraction.update({
    where: { id },
    data: {
      slug,
      name,
      category: str(formData, 'category') || 'attraction',
      categoryLabel: str(formData, 'categoryLabel'),
      status: str(formData, 'status') || 'draft',
      badge: str(formData, 'badge'),
      tagline: str(formData, 'tagline'),
      shortDescription: str(formData, 'shortDescription'),
      longDescription: str(formData, 'longDescription'),
      heroImageUrl,
      heroImageAlt: str(formData, 'heroImageAlt'),
      rating: num(formData, 'rating', 4.5),
      reviewCount: num(formData, 'reviewCount', 0),
      priceFrom: num(formData, 'priceFrom', 0),
      currency: str(formData, 'currency') || 'EUR',
      durationLabel: str(formData, 'durationLabel'),
      freeCancellation: bool(formData, 'freeCancellation'),
      mobileTicket: bool(formData, 'mobileTicket'),
      requiresAllTravelerNames: bool(formData, 'requiresAllTravelerNames'),
      address: str(formData, 'address'),
      mapUrl: str(formData, 'mapUrl'),
      featured: bool(formData, 'featured'),
      popularTour: bool(formData, 'popularTour'),
      sortOrder: num(formData, 'sortOrder', 0),
      metaTitle: str(formData, 'metaTitle'),
      metaDescription: str(formData, 'metaDescription')
    }
  });

  await revalidateAttraction(currentSlug);
  if (slug !== currentSlug) {
    await revalidateAttraction(slug);
    redirect(`/admin/attractions/${slug}`);
  }
  redirect(`/admin/attractions/${slug}?saved=1`);
}

export async function deleteAttraction(id: string) {
  // Editors can update attraction content but not delete attractions —
  // only master accounts can.
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/attractions');

  const attraction = await prisma.attraction.findUnique({ where: { id }, select: { slug: true } });
  await prisma.attraction.delete({ where: { id } });
  if (attraction) await revalidateAttraction(attraction.slug);
  redirect('/admin/attractions');
}

// ---------------------------------------------------------------------------
// Highlights / included / not included / important info — stored as simple
// one-item-per-line textareas in the admin form, replaced wholesale on save
// so re-ordering is just re-ordering the lines.
// ---------------------------------------------------------------------------

export async function replaceHighlights(attractionId: string, slug: string, formData: FormData) {
  const items = lines(formData, 'highlights');
  await prisma.$transaction([
    prisma.highlight.deleteMany({ where: { attractionId } }),
    prisma.highlight.createMany({
      data: items.map((text, i) => ({ attractionId, text, sortOrder: i }))
    })
  ]);
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#content`);
}

export async function replaceIncludedItems(attractionId: string, slug: string, formData: FormData) {
  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');

  await prisma.$transaction([
    prisma.includedItem.deleteMany({ where: { attractionId } }),
    prisma.includedItem.createMany({
      data: [
        ...included.map((text, i) => ({ attractionId, text, included: true, sortOrder: i })),
        ...notIncluded.map((text, i) => ({ attractionId, text, included: false, sortOrder: i }))
      ]
    })
  ]);
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#content`);
}

export async function replaceImportantInfo(attractionId: string, slug: string, formData: FormData) {
  const items = lines(formData, 'importantInfo');
  await prisma.$transaction([
    prisma.importantInfoItem.deleteMany({ where: { attractionId } }),
    prisma.importantInfoItem.createMany({
      data: items.map((text, i) => ({ attractionId, text, sortOrder: i }))
    })
  ]);
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#content`);
}

// ---------------------------------------------------------------------------
// Ticket options — the bookable products. Each has its own row-level form
// in the admin UI (edit in place) plus a separate "add new" form.
// ---------------------------------------------------------------------------

export async function addTicketOption(attractionId: string, slug: string, formData: FormData) {
  const name = str(formData, 'name');
  if (!name) redirect(`/admin/attractions/${slug}#tickets`);

  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  let meetingPointImage = '';
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed.';
      redirect(`/admin/attractions/${slug}?ticketError=${encodeURIComponent(message)}#tickets`);
    }
  }

  await prisma.ticketOption.create({
    data: {
      attractionId,
      name,
      description: str(formData, 'description'),
      price: num(formData, 'price', 0),
      currency: str(formData, 'currency') || 'EUR',
      durationLabel: str(formData, 'durationLabel'),
      freeCancellation: bool(formData, 'freeCancellation'),
      mobileTicket: bool(formData, 'mobileTicket'),
      instantConfirmation: bool(formData, 'instantConfirmation'),
      languages: str(formData, 'languages'),
      groupType: str(formData, 'groupType'),
      badge: str(formData, 'badge'),
      affiliateUrl: '',
      affiliateProvider: 'Direct (Rezdy)',
      sortOrder: num(formData, 'sortOrder', 0),
      meetingPoint: str(formData, 'meetingPoint'),
      meetingPointImage,
      includedItems: {
        create: [
          ...included.map((text, i) => ({ text, included: true, sortOrder: i })),
          ...notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
        ]
      },
      infoItems: { create: beforeYouGo.map((text, i) => ({ text, sortOrder: i })) }
    }
  });

  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#tickets`);
}

export async function updateTicketOption(id: string, slug: string, formData: FormData) {
  const included = lines(formData, 'included');
  const notIncluded = lines(formData, 'notIncluded');
  const beforeYouGo = lines(formData, 'beforeYouGo');

  // Keep the current image unless the admin picked a new file — the hidden
  // "existingMeetingPointImage" input (see [slug]/page.tsx) carries the
  // current URL forward so re-saving the form without touching the file
  // input doesn't wipe it out.
  let meetingPointImage = str(formData, 'existingMeetingPointImage');
  if (hasUploadedFile(formData, 'meetingPointImageFile')) {
    try {
      meetingPointImage = await uploadImageFile(formData.get('meetingPointImageFile') as File, 'ticket-options/meeting-points');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Image upload failed.';
      redirect(`/admin/attractions/${slug}?ticketError=${encodeURIComponent(message)}#tickets`);
    }
  }

  await prisma.$transaction([
    prisma.ticketOption.update({
      where: { id },
      data: {
        name: str(formData, 'name'),
        description: str(formData, 'description'),
        price: num(formData, 'price', 0),
        currency: str(formData, 'currency') || 'EUR',
        durationLabel: str(formData, 'durationLabel'),
        freeCancellation: bool(formData, 'freeCancellation'),
        mobileTicket: bool(formData, 'mobileTicket'),
        instantConfirmation: bool(formData, 'instantConfirmation'),
        languages: str(formData, 'languages'),
        groupType: str(formData, 'groupType'),
        badge: str(formData, 'badge'),
        sortOrder: num(formData, 'sortOrder', 0),
        meetingPoint: str(formData, 'meetingPoint'),
        meetingPointImage
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

  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#tickets`);
}

export async function deleteTicketOption(id: string, slug: string) {
  await prisma.ticketOption.delete({ where: { id } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#tickets`);
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

export async function addFaq(attractionId: string, slug: string, formData: FormData) {
  const question = str(formData, 'question');
  const answer = str(formData, 'answer');
  if (!question || !answer) redirect(`/admin/attractions/${slug}#faqs`);

  await prisma.fAQ.create({ data: { attractionId, question, answer, sortOrder: num(formData, 'sortOrder', 0) } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#faqs`);
}

export async function updateFaq(id: string, slug: string, formData: FormData) {
  await prisma.fAQ.update({
    where: { id },
    data: { question: str(formData, 'question'), answer: str(formData, 'answer') }
  });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#faqs`);
}

export async function deleteFaq(id: string, slug: string) {
  await prisma.fAQ.delete({ where: { id } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#faqs`);
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export async function addImage(attractionId: string, slug: string, formData: FormData) {
  if (!hasUploadedFile(formData, 'imageFile')) redirect(`/admin/attractions/${slug}#images`);

  let url = '';
  try {
    url = await uploadImageFile(formData.get('imageFile') as File, 'attractions/gallery');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image upload failed.';
    redirect(`/admin/attractions/${slug}?error=${encodeURIComponent(message)}#images`);
  }

  await prisma.attractionImage.create({
    data: { attractionId, url, altText: str(formData, 'altText'), sortOrder: num(formData, 'sortOrder', 0) }
  });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#images`);
}

export async function deleteImage(id: string, slug: string) {
  await prisma.attractionImage.delete({ where: { id } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#images`);
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export async function addReview(attractionId: string, slug: string, formData: FormData) {
  const authorName = str(formData, 'authorName');
  const comment = str(formData, 'comment');
  if (!authorName || !comment) redirect(`/admin/attractions/${slug}#reviews`);

  await prisma.review.create({
    data: {
      attractionId,
      authorName,
      authorCountry: str(formData, 'authorCountry'),
      rating: num(formData, 'rating', 5),
      title: str(formData, 'title'),
      comment
    }
  });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#reviews`);
}

export async function deleteReview(id: string, slug: string) {
  await prisma.review.delete({ where: { id } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#reviews`);
}

// ---------------------------------------------------------------------------
// Quick facts — the dark stats strip below the detail page hero
// ---------------------------------------------------------------------------

export async function addQuickFact(attractionId: string, slug: string, formData: FormData) {
  const title = str(formData, 'title');
  if (!title) redirect(`/admin/attractions/${slug}#quick-facts`);

  await prisma.quickFact.create({
    data: {
      attractionId,
      icon: str(formData, 'icon') || 'landmark',
      title,
      subtitle: str(formData, 'subtitle'),
      sortOrder: num(formData, 'sortOrder', 0)
    }
  });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#quick-facts`);
}

export async function deleteQuickFact(id: string, slug: string) {
  await prisma.quickFact.delete({ where: { id } });
  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#quick-facts`);
}
