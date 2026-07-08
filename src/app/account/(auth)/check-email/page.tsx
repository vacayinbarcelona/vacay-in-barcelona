import Link from 'next/link';
import { resendVerificationEmail } from './actions';

export default function CheckEmailPage({
  searchParams
}: {
  searchParams: { email?: string; redirect?: string; resent?: string };
}) {
  const email = searchParams?.email ?? '';
  const redirectTo = searchParams?.redirect || '/account';

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-6 py-14">
      <div className="w-full max-w-sm text-center">
        <p className="text-lg font-semibold text-blue-700 mb-1">Vacay in Barcelona</p>
        <h1 className="text-xl font-semibold mb-2">Check your email</h1>
        <p className="text-sm text-gray-500 mb-6">
          We&rsquo;ve sent a confirmation link to <span className="font-medium">{email || 'your email address'}</span>. Click it to
          activate your account — the link expires in 48 hours.
        </p>

        {searchParams?.resent ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-6">Email resent.</p>
        ) : null}

        <form action={resendVerificationEmail}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="w-full border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium py-2.5 rounded-lg mb-4"
          >
            Resend confirmation email
          </button>
        </form>

        <Link href="/account/sign-in" className="text-sm text-blue-600 font-medium hover:text-blue-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
