'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slugify';

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

  await prisma.attraction.create({
    data: {
      slug,
      name,
      category: str(formData, 'category') || 'attraction',
      categoryLabel: str(formData, 'categoryLabel'),
      status: str(formData, 'status') || 'draft',
      badge: str(formData, 'badge'),
      shortDescription: str(formData, 'shortDescription'),
      longDescription: str(formData, 'longDescription'),
      heroImageUrl: str(formData, 'heroImageUrl'),
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

  await prisma.attraction.update({
    where: { id },
    data: {
      slug,
      name,
      category: str(formData, 'category') || 'attraction',
      categoryLabel: str(formData, 'categoryLabel'),
      status: str(formData, 'status') || 'draft',
      badge: str(formData, 'badge'),
      shortDescription: str(formData, 'shortDescription'),
      longDescription: str(formData, 'longDescription'),
      heroImageUrl: str(formData, 'heroImageUrl'),
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
      sortOrder: num(formData, 'sortOrder', 0)
    }
  });

  await revalidateAttraction(slug);
  redirect(`/admin/attractions/${slug}?saved=1#tickets`);
}

export async function updateTicketOption(id: string, slug: string, formData: FormData) {
  await prisma.ticketOption.update({
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
      sortOrder: num(formData, 'sortOrder', 0)
    }
  });

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
  const url = str(formData, 'url');
  if (!url) redirect(`/admin/attractions/${slug}#images`);

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
