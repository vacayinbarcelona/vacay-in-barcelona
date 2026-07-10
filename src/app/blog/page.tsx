import type { Metadata } from 'next';
import Link from 'next/link';
import { getPublishedBlogPosts, getBlogCategoriesInUse } from '@/lib/blog';
import { getSeoMetadataFor } from '@/lib/siteSettings';
import { BlogCard } from '@/components/blog/BlogCard';
import { LoadMoreBlogPosts } from '@/components/blog/LoadMoreBlogPosts';
import { JsonLd } from '@/components/seo/JsonLd';
import { IconSearch } from '@/components/ui/Icons';

export const revalidate = 60;

const PAGE_SIZE = 9;
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('blog');
  return { title, description, alternates: { canonical: '/blog' } };
}

export default async function BlogPage({ searchParams }: { searchParams: { q?: string; category?: string } }) {
  const q = searchParams?.q?.trim() || '';
  const category = searchParams?.category?.trim() || '';

  const [{ posts, total }, categories] = await Promise.all([
    getPublishedBlogPosts({ q: q || undefined, category: category || undefined, take: PAGE_SIZE }),
    getBlogCategoriesInUse()
  ]);

  const [featuredPost, ...restPosts] = posts;
  const showFeatured = featuredPost && !q && !category;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` }
    ]
  };

  return (
    <div>
      <JsonLd data={breadcrumbJsonLd} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/70 to-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 pt-14 pb-10 text-center">
          <p className="text-xs font-semibold text-blue-600 tracking-wider uppercase mb-3">Vacay in Barcelona Journal</p>
          <h1 className="text-3xl sm:text-4xl font-semibold max-w-2xl mx-auto leading-tight">
            Stories, guides &amp; tips for exploring Barcelona
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-3 max-w-xl mx-auto">
            Everything we&rsquo;ve learned about the city&rsquo;s best attractions, hidden gems, and how to make the most of
            your trip.
          </p>

          <form action="/blog" method="GET" className="relative max-w-md mx-auto mt-7">
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search articles…"
              autoComplete="off"
              className="w-full bg-white rounded-full pl-5 pr-12 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 shadow-md border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
            >
              <IconSearch className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Category filter pills */}
        {categories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Link
              href={q ? `/blog?q=${encodeURIComponent(q)}` : '/blog'}
              className={`text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
                !category ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              All articles
            </Link>
            {categories.map((c) => {
              const params = new URLSearchParams();
              params.set('category', c);
              if (q) params.set('q', q);
              const isActive = category === c;
              return (
                <Link
                  key={c}
                  href={`/blog?${params.toString()}`}
                  className={`text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
                    isActive ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>
        ) : null}

        {q || category ? (
          <p className="text-sm text-gray-500 mb-6">
            {total} article{total !== 1 ? 's' : ''} {q ? <>matching &ldquo;{q}&rdquo;</> : null}
            {q && category ? ' in ' : category ? ' in ' : null}
            {category ? <span className="font-medium text-gray-700">{category}</span> : null}
          </p>
        ) : null}

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-sm">No articles found. Try a different search or browse all articles.</p>
            <Link href="/blog" className="inline-block mt-4 text-blue-600 text-sm font-medium hover:underline">
              View all articles
            </Link>
          </div>
        ) : (
          <>
            {showFeatured ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                  <BlogCard post={featuredPost} featured />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {restPosts.slice(0, 2).map((post) => (
                    <BlogCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(showFeatured ? restPosts.slice(2) : posts).map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>

            <LoadMoreBlogPosts initialCount={posts.length} total={total} q={q || undefined} category={category || undefined} />
          </>
        )}
      </div>
    </div>
  );
}
