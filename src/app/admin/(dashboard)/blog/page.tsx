import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { SavedToast } from '@/components/admin/SavedToast';
import { deleteBlogPost, toggleBlogPostStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const [session, posts] = await Promise.all([
    getSession(),
    prisma.blogPost.findMany({ orderBy: [{ status: 'asc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }] })
  ]);
  const isMaster = session?.role === 'master';

  return (
    <div>
      <SavedToast />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Blog</h1>
          <p className="text-xs text-gray-400 mt-0.5">Articles shown on /blog once published</p>
        </div>
        <Link href="/admin/blog/new" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + New article
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                  No articles yet — write your first one.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id}>
                  <td className="px-4 py-3 font-medium max-w-xs truncate">{post.title}</td>
                  <td className="px-4 py-3 text-gray-500">{post.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {post.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.publishedAt ? formatDate(post.publishedAt) : '—'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-3">
                      <form action={toggleBlogPostStatus.bind(null, post.id)}>
                        <button type="submit" className="text-xs text-gray-500 hover:text-gray-700 font-medium">
                          {post.status === 'published' ? 'Unpublish' : 'Publish'}
                        </button>
                      </form>
                      <Link href={`/admin/blog/${post.id}`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                        Edit
                      </Link>
                      {isMaster ? (
                        <form action={deleteBlogPost.bind(null, post.id)}>
                          <DeleteButton confirmText={`Delete "${post.title}"? This cannot be undone.`} />
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
