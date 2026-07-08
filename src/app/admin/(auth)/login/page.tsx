import { loginAction } from './actions';

export default async function AdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const hasError = searchParams?.error === '1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <p className="text-center text-lg font-semibold text-blue-700 mb-1">Vacay in Barcelona</p>
        <p className="text-center text-xs text-gray-400 mb-8">Admin login</p>

        <form action={loginAction} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          {hasError ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              Incorrect email or password.
            </p>
          ) : null}

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
            <input
              type="email"
              name="email"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
            <input type="password" name="password" required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
