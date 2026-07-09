import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { SavedToast } from '@/components/admin/SavedToast';
import { createAdminUser, deleteAdminUser } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Please fill in both the email and password.',
  weak: 'Password must be at least 8 characters.',
  exists: 'An admin account with that email already exists.',
  self: "You can't remove the account you're currently signed in with."
};

export default async function TeamPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const session = await getSession();
  if (session?.role !== 'master') redirect('/admin/attractions');

  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Admin team</h1>
        <p className="text-sm text-gray-500 mt-1">
          Master accounts have full access. Editor accounts can only update attractions content and SEO.
        </p>
      </div>

      <SavedToast show={!!searchParams?.saved} />
      {errorMessage ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p> : null}

      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-semibold mb-4">Accounts</h2>

        <ul className="divide-y divide-gray-100 mb-5">
          <li className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{process.env.ADMIN_EMAIL}</p>
              <p className="text-xs text-gray-400">Owner account — always master, set in .env</p>
            </div>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">master</span>
          </li>

          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{admin.email}</p>
                <p className="text-xs text-gray-400">Added {formatDate(admin.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    admin.role === 'master' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {admin.role}
                </span>
                <form action={deleteAdminUser.bind(null, admin.id)}>
                  <DeleteButton confirmText={`Remove admin access for ${admin.email}?`} />
                </form>
              </div>
            </li>
          ))}
        </ul>

        <form action={createAdminUser} className="space-y-3 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input type="email" name="email" required className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
              <input type="password" name="password" required minLength={8} className="input" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Role</label>
            <select name="role" className="input" defaultValue="editor">
              <option value="editor">Editor — attractions content &amp; SEO only</option>
              <option value="master">Master — full access</option>
            </select>
          </div>
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            Add admin
          </button>
        </form>
      </div>
    </div>
  );
}
