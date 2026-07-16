import { setSupplierPasswordAction } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-token': 'This link is invalid or has expired. Ask the Master Admin to resend your approval email if you still need to set your password.',
  weak: 'Password must be at least 8 characters.',
  mismatch: "Passwords don't match."
};

export default async function SupplierSetPasswordPage({ searchParams }: { searchParams: { token?: string; error?: string } }) {
  const token = searchParams?.token ?? '';
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <p className="text-center text-lg font-semibold text-blue-700 mb-1">Vacay in Barcelona</p>
        <p className="text-center text-xs text-gray-400 mb-8">Set your supplier panel password</p>

        {!token && !errorMessage ? (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            This link is missing its token — please use the link from your approval email.
          </p>
        ) : (
          <form action={setSupplierPasswordAction} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
            <input type="hidden" name="token" value={token} />

            {errorMessage ? (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p>
            ) : null}

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">New password</label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                autoFocus
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">At least 8 characters.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Confirm password</label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg">
              Set password &amp; sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
