import { put } from '@vercel/blob';

// Handles admin-panel "browse & upload" image fields (currently: each
// ticket option's meeting point photo). Vercel's serverless functions have
// a read-only filesystem at runtime (except /tmp, which doesn't persist
// between requests), so a plain fs.writeFile into /public only works in
// local dev — it silently does nothing useful in production. Vercel Blob
// (https://vercel.com/docs/storage/vercel-blob) is the standard fix: it
// stores the file externally and hands back a public HTTPS URL, which is
// exactly what the meetingPointImage field expects.
//
// Requires BLOB_READ_WRITE_TOKEN — see .env.example for setup.

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadImageFile(file: File, folder: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN is not set. Create a Blob store in your Vercel dashboard (Storage tab) and add the token to .env — see .env.example.'
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large — please upload a file under 5MB.');
  }

  const extension = file.name.split('.').pop() || 'jpg';
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

  const blob = await put(filename, file, { access: 'public' });
  return blob.url;
}

// A plain <input type="file"> that the admin left empty comes through as a
// zero-byte File with an empty name — treat that the same as "no file
// chosen" rather than trying (and failing) to upload it.
export function hasUploadedFile(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value instanceof File && value.size > 0 && value.name !== '';
}
