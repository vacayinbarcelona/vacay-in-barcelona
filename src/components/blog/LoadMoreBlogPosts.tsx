'use client';

import { useState } from 'react';
import { BlogCard } from './BlogCard';
import type { BlogPostCardData } from '@/types';

const PAGE_SIZE = 9;

// The first page of posts is server-rendered (see src/app/blog/page.tsx);
// this only kicks in once someone clicks "Load more", fetching subsequent
// pages from /api/blog and appending them client-side rather than a full
// page reload — matches the "premium, modern" feel the blog is going for.
export function LoadMoreBlogPosts({
  initialCount,
  total,
  q,
  category
}: {
  initialCount: number;
  total: number;
  q?: string;
  category?: string;
}) {
  const [posts, setPosts] = useState<BlogPostCardData[]>([]);
  const [loaded, setLoaded] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const hasMore = loaded < total;

  async function loadMore() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category) params.set('category', category);
      params.set('skip', String(loaded));
      params.set('take', String(PAGE_SIZE));

      const res = await fetch(`/api/blog?${params.toString()}`);
      const data = await res.json();
      const newPosts: BlogPostCardData[] = data.posts ?? [];

      setPosts((prev) => [...prev, ...newPosts]);
      setLoaded((prev) => prev + newPosts.length);
    } finally {
      setLoading(false);
    }
  }

  if (!hasMore && posts.length === 0) return null;

  return (
    <>
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center mt-10">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium px-8 py-3 rounded-full"
          >
            {loading ? 'Loading…' : 'Load more articles'}
          </button>
        </div>
      ) : null}
    </>
  );
}
