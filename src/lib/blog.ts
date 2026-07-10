import { prisma } from '@/lib/db';
import { fuzzySearch } from '@/lib/search';
import type { BlogPostCardData } from '@/types';

// Shared by the /blog listing page (first page, server-rendered) and the
// /api/blog route (subsequent "Load More" pages, client-fetched) so both
// stay in sync on filtering/sorting/search behavior.

const CARD_SELECT = {
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  featuredImageUrl: true,
  featuredImageAlt: true,
  authorName: true,
  category: true,
  publishedAt: true
} as const;

export async function getPublishedBlogPosts(
  options: { q?: string; category?: string; skip?: number; take?: number } = {}
): Promise<{ posts: BlogPostCardData[]; total: number }> {
  const { q, category, skip = 0, take = 9 } = options;

  const where = {
    status: 'published' as const,
    ...(category ? { category } : {})
  };

  if (q && q.trim()) {
    // Fuzzy matching needs to rank across every candidate, so this fetches
    // all published posts rather than paginating in SQL — fine at this
    // catalogue's scale (see src/lib/search.ts for the same tradeoff on
    // attraction search).
    const all = await prisma.blogPost.findMany({ where, select: CARD_SELECT, orderBy: { publishedAt: 'desc' } });
    const ranked = fuzzySearch(all, q, (p) => `${p.title} ${p.excerpt}`);
    return { posts: ranked.slice(skip, skip + take), total: ranked.length };
  }

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ where, select: CARD_SELECT, orderBy: { publishedAt: 'desc' }, skip, take }),
    prisma.blogPost.count({ where })
  ]);

  return { posts, total };
}

export async function getBlogCategoriesInUse(): Promise<string[]> {
  const rows = await prisma.blogPost.findMany({
    where: { status: 'published' },
    select: { category: true },
    distinct: ['category']
  });
  return rows.map((r) => r.category).sort();
}

// Same category first, then fills in with the most recent other posts if
// there aren't enough — an article is never left with an empty "Related
// articles" section just because it's the only one in its category yet.
export async function getRelatedBlogPosts(currentSlug: string, category: string, limit = 3): Promise<BlogPostCardData[]> {
  const sameCategory = await prisma.blogPost.findMany({
    where: { status: 'published', category, slug: { not: currentSlug } },
    select: CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: limit
  });

  if (sameCategory.length >= limit) return sameCategory;

  const fillerNeeded = limit - sameCategory.length;
  const excludeSlugs = [currentSlug, ...sameCategory.map((p) => p.slug)];
  const filler = await prisma.blogPost.findMany({
    where: { status: 'published', slug: { notIn: excludeSlugs } },
    select: CARD_SELECT,
    orderBy: { publishedAt: 'desc' },
    take: fillerNeeded
  });

  return [...sameCategory, ...filler];
}
