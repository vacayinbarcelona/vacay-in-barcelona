import { BLOG_CATEGORIES } from '@/lib/blogCategories';
import { MarkdownImageField } from '@/components/admin/MarkdownImageField';

type BlogPostFormValues = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImageUrl: string;
  featuredImageAlt: string;
  authorName: string;
  authorImageUrl: string;
  category: string;
  status: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: number;
};

const EMPTY_VALUES: BlogPostFormValues = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImageUrl: '',
  featuredImageAlt: '',
  authorName: 'Vacay in Barcelona Team',
  authorImageUrl: '',
  category: BLOG_CATEGORIES[0],
  status: 'draft',
  metaTitle: '',
  metaDescription: '',
  sortOrder: 0
};

// Shared by both /admin/blog/new and /admin/blog/[id] — the only
// difference between "create" and "edit" is which server action the form
// posts to and what the fields are pre-filled with.
export function BlogPostForm({
  action,
  submitLabel,
  values = EMPTY_VALUES,
  errorMessage
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  values?: BlogPostFormValues;
  errorMessage?: string;
}) {
  return (
    <form action={action} encType="multipart/form-data" className="space-y-6">
      {errorMessage ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Field label="Title">
          <input name="title" defaultValue={values.title} required className="input" placeholder="e.g. Things to Do in Barcelona" />
        </Field>

        <Field label="Slug" hint="Leave blank to auto-generate from the title. Changing this changes the public URL.">
          <input name="slug" defaultValue={values.slug} className="input" placeholder="e.g. things-to-do-in-barcelona" />
        </Field>

        <Field label="Excerpt" hint="Shown on the blog cards. Leave blank to auto-generate from the first line of the article.">
          <textarea name="excerpt" defaultValue={values.excerpt} rows={2} className="input" />
        </Field>

        <MarkdownImageField name="content" defaultValue={values.content} required />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Featured image</p>
        <Field label="Image" hint="Shown on the blog card and as the article's hero image">
          {values.featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.featuredImageUrl} alt="" className="mb-2 h-28 w-48 object-cover rounded-lg border border-gray-200" />
          ) : null}
          <input type="hidden" name="existingFeaturedImageUrl" value={values.featuredImageUrl} />
          <input type="file" name="featuredImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
          <p className="text-[11px] text-gray-400 mt-1">
            {values.featuredImageUrl ? 'Choose a file to replace it, or leave blank to keep the current one.' : 'JPG, PNG, WEBP, or GIF — up to 5MB.'}
          </p>
        </Field>
        <Field label="Image alt text" hint="For accessibility & SEO">
          <input name="featuredImageAlt" defaultValue={values.featuredImageAlt} className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Author</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name">
            <input name="authorName" defaultValue={values.authorName} className="input" />
          </Field>
          <Field label="Category">
            <select name="category" defaultValue={values.category} className="input">
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Author photo" hint="Optional — a small round avatar shown on the article">
          {values.authorImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.authorImageUrl} alt="" className="mb-2 h-14 w-14 object-cover rounded-full border border-gray-200" />
          ) : null}
          <input type="hidden" name="existingAuthorImageUrl" value={values.authorImageUrl} />
          <input type="file" name="authorImageFile" accept="image/jpeg,image/png,image/webp,image/gif" className="input" />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">Publishing</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select name="status" defaultValue={values.status} className="input">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Sort order" hint="Tie-breaker only — articles are otherwise sorted newest first">
            <input name="sortOrder" type="number" defaultValue={values.sortOrder} className="input" />
          </Field>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <p className="text-sm font-semibold">SEO</p>
        <Field label="Meta title" hint="Leave blank to use the article title">
          <input name="metaTitle" defaultValue={values.metaTitle} className="input" />
        </Field>
        <Field label="Meta description" hint="Leave blank to use the excerpt">
          <textarea name="metaDescription" defaultValue={values.metaDescription} rows={2} className="input" />
        </Field>
      </div>

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-600 mb-1 block">{label}</span>
      {children}
      {hint ? <span className="text-[11px] text-gray-400 mt-1 block">{hint}</span> : null}
    </label>
  );
}
