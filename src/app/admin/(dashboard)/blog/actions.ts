'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { slugify } from '@/lib/slugify';
import { getSession } from '@/lib/auth';
import { uploadImageFile, hasUploadedFile } from '@/lib/upload';
import { BLOG_CATEGORIES } from '@/lib/blogCategories';

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? '').trim();
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === '') return fallback;
  const n = Number(raw);
  return Number.isNaN(n) ? fallback : n;
}

function normalizedCategory(formData: FormData): string {
  const value = str(formData, 'category');
  return (BLOG_CATEGORIES as readonly string[]).includes(value) ? value : BLOG_CATEGORIES[0];
}

function revalidateBlog(slug?: string) {
  revalidatePath('/blog');
  revalidatePath('/admin/blog');
  if (slug) revalidatePath(`/blog/${slug}`);
}

async function resolveImage(
  formData: FormData,
  fileFieldName: string,
  existingFieldName: string,
  folder: string,
  redirectOnError: () => never
): Promise<string> {
  if (!hasUploadedFile(formData, fileFieldName)) {
    return str(formData, existingFieldName);
  }
  try {
    return await uploadImageFile(formData.get(fileFieldName) as File, folder);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Image upload failed.';
    redirectOnError();
    throw new Error(message); // unreachable — redirectOnError() always redirects/throws
  }
}

export async function createBlogPost(formData: FormData) {
  const title = str(formData, 'title');
  const content = str(formData, 'content');
  if (!title || !content) {
    redirect(`/admin/blog/new?error=${encodeURIComponent('Title and content are required.')}`);
  }

  const slug = slugify(str(formData, 'slug') || title);
  const status = str(formData, 'status') === 'published' ? 'published' : 'draft';

  const featuredImageUrl = await resolveImage(formData, 'featuredImageFile', 'existingFeaturedImageUrl', 'blog/featured', () =>
    redirect(`/admin/blog/new?error=${encodeURIComponent('Featured image upload failed.')}`)
  );
  const authorImageUrl = await resolveImage(formData, 'authorImageFile', 'existingAuthorImageUrl', 'blog/authors', () =>
    redirect(`/admin/blog/new?error=${encodeURIComponent('Author image upload failed.')}`)
  );

  const post = await prisma.blogPost.create({
    data: {
      slug,
      title,
      excerpt: str(formData, 'excerpt'),
      content,
      featuredImageUrl,
      featuredImageAlt: str(formData, 'featuredImageAlt'),
      authorName: str(formData, 'authorName') || 'Vacay in Barcelona Team',
      authorImageUrl,
      category: normalizedCategory(formData),
      status,
      publishedAt: status === 'published' ? new Date() : null,
      metaTitle: str(formData, 'metaTitle'),
      metaDescription: str(formData, 'metaDescription'),
      sortOrder: num(formData, 'sortOrder', 0)
    }
  });

  revalidateBlog(post.slug);
  redirect(`/admin/blog/${post.id}?saved=${Date.now()}`);
}

export async function updateBlogPost(id: string, currentSlug: string, formData: FormData) {
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { status: true, publishedAt: true } });
  if (!existing) redirect('/admin/blog');

  const title = str(formData, 'title');
  const content = str(formData, 'content');
  if (!title || !content) {
    redirect(`/admin/blog/${id}?error=${encodeURIComponent('Title and content are required.')}`);
  }

  const slug = slugify(str(formData, 'slug') || title) || currentSlug;
  const status = str(formData, 'status') === 'published' ? 'published' : 'draft';

  const featuredImageUrl = await resolveImage(formData, 'featuredImageFile', 'existingFeaturedImageUrl', 'blog/featured', () =>
    redirect(`/admin/blog/${id}?error=${encodeURIComponent('Featured image upload failed.')}`)
  );
  const authorImageUrl = await resolveImage(formData, 'authorImageFile', 'existingAuthorImageUrl', 'blog/authors', () =>
    redirect(`/admin/blog/${id}?error=${encodeURIComponent('Author image upload failed.')}`)
  );

  // publishedAt is set the first time a post goes live, then left alone —
  // unpublishing and republishing later shouldn't reset "originally
  // published" to today.
  const publishedAt = status === 'published' ? (existing.publishedAt ?? new Date()) : existing.publishedAt;

  await prisma.blogPost.update({
    where: { id },
    data: {
      slug,
      title,
      excerpt: str(formData, 'excerpt'),
      content,
      featuredImageUrl,
      featuredImageAlt: str(formData, 'featuredImageAlt'),
      authorName: str(formData, 'authorName') || 'Vacay in Barcelona Team',
      authorImageUrl,
      category: normalizedCategory(formData),
      status,
      publishedAt,
      metaTitle: str(formData, 'metaTitle'),
      metaDescription: str(formData, 'metaDescription'),
      sortOrder: num(formData, 'sortOrder', 0)
    }
  });

  revalidateBlog(currentSlug);
  if (slug !== currentSlug) revalidateBlog(slug);
  redirect(`/admin/blog/${id}?saved=${Date.now()}`);
}

// Quick action from the list page — flips draft <-> published without
// opening the full edit form. Reuses the same "set publishedAt once" rule
// as updateBlogPost above.
export async function toggleBlogPostStatus(id: string) {
  const existing = await prisma.blogPost.findUnique({ where: { id }, select: { status: true, publishedAt: true, slug: true } });
  if (!existing) redirect('/admin/blog');

  const nextStatus = existing.status === 'published' ? 'draft' : 'published';

  await prisma.blogPost.update({
    where: { id },
    data: {
      status: nextStatus,
      publishedAt: nextStatus === 'published' ? (existing.publishedAt ?? new Date()) : existing.publishedAt
    }
  });

  revalidateBlog(existing.slug);
  redirect(`/admin/blog?saved=${Date.now()}`);
}

export async function deleteBlogPost(id: string) {
  // Editors can create/edit posts but not delete them — only master
  // accounts can, matching the same rule already used for attractions.
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/blog');

  const post = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
  await prisma.blogPost.delete({ where: { id } });
  if (post) revalidateBlog(post.slug);
  redirect('/admin/blog');
}
