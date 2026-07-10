import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { SavedToast } from '@/components/admin/SavedToast';
import { BlogPostForm } from '../BlogPostForm';
import { updateBlogPost } from '../actions';

export default async function EditBlogPostPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const post = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!post) notFound();

  const boundUpdate = updateBlogPost.bind(null, post.id, post.slug);

  return (
    <div className="max-w-2xl pb-24">
      <SavedToast />
      <div className="flex items-center justify-between mb-1">
        <Link href="/admin/blog" className="text-xs text-blue-600 font-medium">
          &larr; Back to blog
        </Link>
        {post.status === 'published' ? (
          <Link href={`/blog/${post.slug}`} target="_blank" className="text-xs text-blue-600 font-medium">
            View live page &rarr;
          </Link>
        ) : null}
      </div>
      <h1 className="text-xl font-semibold mt-3 mb-6">{post.title}</h1>

      <BlogPostForm
        action={boundUpdate}
        submitLabel="Save changes"
        errorMessage={searchParams?.error}
        values={{
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt,
          content: post.content,
          featuredImageUrl: post.featuredImageUrl,
          featuredImageAlt: post.featuredImageAlt,
          authorName: post.authorName,
          authorImageUrl: post.authorImageUrl,
          category: post.category,
          status: post.status,
          metaTitle: post.metaTitle,
          metaDescription: post.metaDescription,
          sortOrder: post.sortOrder
        }}
      />
    </div>
  );
}
