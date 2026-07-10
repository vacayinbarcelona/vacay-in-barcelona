import { NextRequest, NextResponse } from 'next/server';
import { getPublishedBlogPosts } from '@/lib/blog';

// Backs the "Load More" button on /blog — the first page is server-rendered
// (see src/app/blog/page.tsx), and this route serves every page after that
// so scrolling through the archive doesn't need a full page reload.
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const q = params.get('q') ?? undefined;
  const category = params.get('category') ?? undefined;
  const skip = Number(params.get('skip') ?? 0) || 0;
  const take = Math.min(Number(params.get('take') ?? 9) || 9, 24);

  const { posts, total } = await getPublishedBlogPosts({ q, category, skip, take });

  return NextResponse.json({ posts, total });
}
