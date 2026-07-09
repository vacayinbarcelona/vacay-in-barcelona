import Link from 'next/link';
import { prisma } from '@/lib/db';
import { getSiteSettings, SEO_PAGES } from '@/lib/siteSettings';
import { SavedToast } from '@/components/admin/SavedToast';
import { updateSeoSettings } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminSeoPage({ searchParams }: { searchParams: { saved?: string } }) {
  const keys = SEO_PAGES.flatMap((p) => [`seo.${p.key}.title`, `seo.${p.key}.description`]);
  const [settings, attractions] = await Promise.all([
    getSiteSettings(keys),
    prisma.attraction.findMany({
      orderBy: { sortOrder: 'asc' },
      select: { slug: true, name: true, metaTitle: true, metaDescription: true }
    })
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">SEO</h1>
      <p className="text-sm text-gray-500 mb-6">
        Title and meta description for the homepage and static pages. Leave a field blank to use the built-in
        default. Attraction pages have their own SEO fields on each attraction&apos;s edit page instead.
      </p>

      <SavedToast show={searchParams?.saved === '1'} />

      <form action={updateSeoSettings} className="space-y-5">
        {SEO_PAGES.map((page) => (
          <div key={page.key} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">{page.label}</h2>
              <span className="text-[11px] text-gray-400">{page.path}</span>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">Title</span>
                <input
                  name={`${page.key}__title`}
                  defaultValue={settings[`seo.${page.key}.title`] ?? ''}
                  placeholder={page.defaultTitle}
                  className="input"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-600 mb-1 block">Meta description</span>
                <textarea
                  name={`${page.key}__description`}
                  rows={2}
                  defaultValue={settings[`seo.${page.key}.description`] ?? ''}
                  placeholder={page.defaultDescription}
                  className="input"
                />
              </label>
            </div>
          </div>
        ))}

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
          Save all
        </button>
      </form>

      <div className="mt-10">
        <h2 className="text-sm font-semibold mb-1">Attractions &amp; tours</h2>
        <p className="text-xs text-gray-400 mb-4">
          Each attraction has its own SEO fields (they need attraction-specific content, not a shared default) —
          edited on that attraction&apos;s own page. Shown here read-only so everything SEO-related is easy to find.
        </p>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3">Attraction</th>
                <th className="px-4 py-3">Meta title</th>
                <th className="px-4 py-3">Meta description</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attractions.map((a) => (
                <tr key={a.slug}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{a.name}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[220px] truncate">{a.metaTitle || <span className="text-gray-300">Not set</span>}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-[280px] truncate">
                    {a.metaDescription || <span className="text-gray-300">Not set</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link href={`/admin/attractions/${a.slug}#content`} className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      Edit &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
