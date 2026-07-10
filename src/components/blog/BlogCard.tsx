import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/lib/format';
import { estimateReadingMinutes, excerptFromMarkdown } from '@/lib/markdown';
import { IconClock, IconUser } from '@/components/ui/Icons';
import type { BlogPostCardData } from '@/types';

export function BlogCard({ post, featured = false }: { post: BlogPostCardData; featured?: boolean }) {
  const excerpt = post.excerpt || excerptFromMarkdown(post.content);
  const readingMinutes = estimateReadingMinutes(post.content);

  return (
    <article className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow bg-white flex flex-col h-full">
      <Link href={`/blog/${post.slug}`} className={`block relative overflow-hidden flex-shrink-0 ${featured ? 'h-72 sm:h-80' : 'h-48'}`}>
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={post.featuredImageAlt || post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes={featured ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-amber-50" />
        )}
        <span className="absolute top-3 left-3 bg-white/95 text-blue-700 text-[11px] font-semibold px-2.5 py-1 rounded-full tracking-wide">
          {post.category}
        </span>
      </Link>

      <div className={`p-5 flex flex-col flex-1 ${featured ? 'sm:p-7' : ''}`}>
        <Link href={`/blog/${post.slug}`}>
          <h3 className={`font-semibold hover:text-blue-700 leading-snug ${featured ? 'text-xl sm:text-2xl' : 'text-base'}`}>{post.title}</h3>
        </Link>

        <p className={`text-gray-500 mt-2 leading-relaxed ${featured ? 'text-sm sm:text-base line-clamp-3' : 'text-sm line-clamp-2'} flex-1`}>
          {excerpt}
        </p>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <IconUser className="h-3.5 w-3.5" />
            {post.authorName}
          </span>
          <span className="text-gray-300">&middot;</span>
          {post.publishedAt ? <span>{formatDate(post.publishedAt)}</span> : null}
          <span className="text-gray-300">&middot;</span>
          <span className="flex items-center gap-1.5">
            <IconClock className="h-3.5 w-3.5" />
            {readingMinutes} min read
          </span>
        </div>
      </div>
    </article>
  );
}
