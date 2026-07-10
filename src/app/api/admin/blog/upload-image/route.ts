import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadImageFile } from '@/lib/upload';

// Used by the "Attach photo" button in the blog content editor
// (src/components/admin/MarkdownImageField.tsx) — the article body is a
// plain <textarea>, not a rich text editor, so inserting an in-article
// image needs its own upload endpoint the client can hit directly and get
// a URL back, rather than going through a page's server action.
export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }

  try {
    const url = await uploadImageFile(file, 'blog-content');
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
