import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

// Static pages that should always be indexed, even with an empty database.
const STATIC_ROUTES = ['', '/blog', '/about-us', '/contact-us', '/privacy-policy', '/terms-conditions', '/affiliate-disclosure'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [attractions, blogPosts] = await Promise.all([
    prisma.attraction.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true }
    }),
    prisma.blogPost.findMany({
      where: { status: 'published' },
      select: { slug: true, updatedAt: true }
    })
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'monthly',
    priority: path === '' ? 1 : 0.4
  }));

  const attractionEntries: MetadataRoute.Sitemap = attractions.map((a) => ({
    url: `${siteUrl}/attractions/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.9
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.6
  }));

  return [...staticEntries, ...attractionEntries, ...blogEntries];
}
