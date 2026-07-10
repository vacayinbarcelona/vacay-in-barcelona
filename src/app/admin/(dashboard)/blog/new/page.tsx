import Link from 'next/link';
import { BlogPostForm } from '../BlogPostForm';
import { createBlogPost } from '../actions';

export default function NewBlogPostPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="max-w-2xl pb-24">
      <Link href="/admin/blog" className="text-xs text-blue-600 font-medium">
        &larr; Back to blog
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-1">New article</h1>
      <p className="text-sm text-gray-500 mb-6">Write the article, then save it as a draft or publish it right away.</p>

      <BlogPostForm action={createBlogPost} submitLabel="Create article" errorMessage={searchParams?.error} />
    </div>
  );
}
