import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { formatDate } from '@/lib/format';
import { renderMarkdown, estimateReadingMinutes, excerptFromMarkdown } from '@/lib/markdown';
import { getRelatedBlogPosts } from '@/lib/blog';
import { BlogCard } from '@/components/blog/BlogCard';
import { ShareButtons } from '@/components/blog/ShareButtons';
import { TableOfContents } from '@/components/blog/TableOfContents';
import { NewsletterSignup } from '@/components/blog/NewsletterSignup';
import { JsonLd } from '@/components/seo/JsonLd';
import { IconCalendar, IconClock, IconUser, IconArrowRight } from '@/components/ui/Icons';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

async function getPost(slug: string) {
  const post = await prisma.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== 'published') return null;
  return post;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || excerptFromMarkdown(post.content);

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      type: 'article',
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : undefined
    }
  };
}

export default async function BlogArticlePage({
  params,
  searchParams
}: {
  params: { slug: string };
  searchParams: { subscribed?: string; subscribeError?: string };
}) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const { html, headings } = renderMarkdown(post.content);
  const readingMinutes = estimateReadingMinutes(post.content);
  const relatedPosts = await getRelatedBlogPosts(post.slug, post.category);
  const articleUrl = `${siteUrl}/blog/${post.slug}`;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: articleUrl }
    ]
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || excerptFromMarkdown(post.content),
    image: post.featuredImageUrl ? [post.featuredImageUrl] : undefined,
    author: { '@type': 'Person', name: post.authorName },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl }
  };

  return (
    <article>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={articleJsonLd} />

      {/* Hero */}
      <section className="relative h-[46vh] sm:h-[52vh] min-h-[360px] max-h-[560px]">
        {post.featuredImageUrl ? (
          <Image src={post.featuredImageUrl} alt={post.featuredImageAlt || post.title} fill priority className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-amber-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

        <div className="relative max-w-3xl mx-auto h-full flex flex-col justify-end px-6 pb-8 sm:pb-10">
          <nav className="text-xs text-white/70 mb-3">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{' '}
            &gt;{' '}
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>{' '}
            &gt; <span className="text-white/90">{post.category}</span>
          </nav>

          <span className="inline-flex items-center self-start rounded-full bg-white/95 text-blue-700 text-[11px] font-semibold px-3 py-1 mb-3 tracking-wide">
            {post.category}
          </span>

          <h1 className="text-white text-2xl sm:text-4xl font-semibold leading-tight max-w-2xl">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 text-white/85 text-xs sm:text-sm">
            <span className="flex items-center gap-1.5">
              <IconUser className="h-3.5 w-3.5" />
              {post.authorName}
            </span>
            {post.publishedAt ? (
              <span className="flex items-center gap-1.5">
                <IconCalendar className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
            ) : null}
            <span className="flex items-center gap-1.5">
              <IconClock className="h-3.5 w-3.5" />
              {readingMinutes} min read
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-10">
          <div className="min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-8 pb-6 border-b border-gray-100">
              <p className="text-xs text-gray-400">Share this article</p>
              <ShareButtons url={articleUrl} title={post.title} />
            </div>

            {/* Mobile-only TOC, above the content */}
            <div className="lg:hidden mb-8">
              <TableOfContents headings={headings} />
            </div>

            <div
              className="prose prose-gray max-w-none prose-headings:font-semibold prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-blockquote:border-blue-300 prose-blockquote:text-gray-600 prose-blockquote:not-italic"
              // Admin-authored content only — see src/lib/markdown.ts for the trust model.
              dangerouslySetInnerHTML={{ __html: html }}
            />

            <div className="flex items-center justify-between flex-wrap gap-3 mt-10 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-400">Enjoyed this article? Share it</p>
              <ShareButtons url={articleUrl} title={post.title} />
            </div>

            {/* Author card */}
            <div className="flex items-center gap-4 mt-10 p-5 rounded-2xl bg-gray-50 border border-gray-100">
              {post.authorImageUrl ? (
                <div className="relative h-14 w-14 rounded-full overflow-hidden flex-shrink-0">
                  <Image src={post.authorImageUrl} alt={post.authorName} fill className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 font-semibold">
                  {post.authorName.charAt(0)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{post.authorName}</p>
                <p className="text-xs text-gray-500">Vacay in Barcelona</p>
              </div>
            </div>
          </div>

          {/* Desktop sidebar TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <TableOfContents headings={headings} />
            </div>
          </aside>
        </div>
      </div>

      {/* Related articles */}
      {relatedPosts.length > 0 ? (
        <section className="max-w-6xl mx-auto px-6 pb-14 border-t border-gray-100 pt-12">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-xl font-semibold">More from the blog</h2>
            <Link href="/blog" className="text-blue-600 text-sm font-medium whitespace-nowrap flex items-center gap-1">
              See all articles <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {relatedPosts.map((related) => (
              <BlogCard key={related.slug} post={related} />
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA + Newsletter */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-10 sm:px-10 flex flex-col justify-center">
            <h2 className="text-xl sm:text-2xl font-semibold">Ready to experience Barcelona?</h2>
            <p className="text-white/80 text-sm mt-2 max-w-sm">
              Browse skip-the-line tickets and guided tours for the city&rsquo;s best attractions — instant confirmation,
              free cancellation.
            </p>
            <Link
              href="/attractions"
              className="inline-flex items-center gap-1.5 self-start bg-white text-blue-700 text-sm font-medium px-6 py-3 rounded-full mt-6 hover:bg-blue-50"
            >
              Browse attractions & tours
              <IconArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <NewsletterSignup redirectTo={`/blog/${post.slug}`} subscribed={searchParams?.subscribed === '1'} error={searchParams?.subscribeError} />
        </div>
      </section>
    </article>
  );
}
