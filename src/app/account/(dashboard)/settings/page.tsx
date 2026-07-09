import { getCurrentUser } from '@/lib/customerAuth';
import { SavedToast } from '@/components/admin/SavedToast';
import { updateProfileAction } from './actions';

export default async function AccountSettingsPage({ searchParams }: { searchParams: { saved?: string; error?: string } }) {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirects signed-out visitors

  const dobValue = user.dateOfBirth ? user.dateOfBirth.toISOString().slice(0, 10) : '';

  return (
    <div className="border border-gray-200 rounded-2xl p-6 max-w-lg">
      <h2 className="text-sm font-semibold mb-4">My details</h2>

      <SavedToast show={!!searchParams?.saved} message="Details saved." />
      {searchParams?.error === 'missing' ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
          First and last name are required.
        </p>
      ) : null}

      <form action={updateProfileAction} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">First name</label>
            <input name="firstName" defaultValue={user.firstName} required className="input" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Last name</label>
            <input name="lastName" defaultValue={user.lastName} required className="input" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input value={user.email} disabled className="input bg-gray-50 text-gray-400" />
          <p className="text-[11px] text-gray-400 mt-1">Contact us to change the email on your account.</p>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Phone number</label>
          <input type="tel" name="phone" defaultValue={user.phone} placeholder="+34 600 000 000" className="input" />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Date of birth</label>
          <input type="date" name="dateOfBirth" defaultValue={dobValue} className="input" />
        </div>

        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full">
          Save changes
        </button>
      </form>
    </div>
  );
}
