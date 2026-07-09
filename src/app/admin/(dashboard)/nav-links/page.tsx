import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { SavedToast } from '@/components/admin/SavedToast';
import { createNavLink, deleteNavLink } from './actions';

async function getLinks(location: 'header' | 'footer') {
  return prisma.navLink.findMany({ where: { location }, orderBy: { sortOrder: 'asc' } });
}

function LinkGroup({
  title,
  hint,
  location,
  links
}: {
  title: string;
  hint: string;
  location: 'header' | 'footer';
  links: { id: string; label: string; href: string }[];
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6">
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      <p className="text-xs text-gray-400 mb-4">{hint}</p>

      {links.length > 0 ? (
        <ul className="divide-y divide-gray-100 mb-5">
          {links.map((link) => (
            <li key={link.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.href}</p>
              </div>
              <form action={deleteNavLink.bind(null, link.id)}>
                <DeleteButton confirmText={`Remove "${link.label}" from the ${location}?`} />
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-400 mb-5">No links yet.</p>
      )}

      <form action={createNavLink} className="flex flex-wrap items-end gap-2 pt-4 border-t border-gray-100">
        <input type="hidden" name="location" value={location} />
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Label</label>
          <input name="label" placeholder="e.g. Casa Batlló" required className="input" />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs font-medium text-gray-600 mb-1 block">Link (path or URL)</label>
          <input name="href" placeholder="/attractions/casa-batllo" required className="input" />
        </div>
        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          Add
        </button>
      </form>
    </div>
  );
}

export default async function NavLinksPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/attractions');

  const [headerLinks, footerLinks] = await Promise.all([getLinks('header'), getLinks('footer')]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Header &amp; footer links</h1>
        <p className="text-sm text-gray-500 mt-1">Manage the navigation links shown in the site header and footer.</p>
      </div>

      <SavedToast />
      {searchParams?.error === 'missing' ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Please fill in both the label and the link.
        </p>
      ) : null}

      <LinkGroup
        title="Header links"
        hint="Shown on the right side of the site header, next to the cart and sign-in button."
        location="header"
        links={headerLinks}
      />

      <LinkGroup
        title="Footer links"
        hint="Shown at the bottom of every page."
        location="footer"
        links={footerLinks}
      />

      <p className="text-xs text-gray-400">
        Links can point to a path on this site (e.g. <code>/attractions/park-guell</code>) or a full URL (e.g.{' '}
        <code>https://example.com</code>).
      </p>
    </div>
  );
}
