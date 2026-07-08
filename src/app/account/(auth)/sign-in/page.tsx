import Link from 'next/link';
import { signInAction } from './actions';
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget';

const ERROR_MESSAGES: Record<string, string> = {
  '1': 'Incorrect email or password.',
  'google-only': 'This email signed up with Google — continue with Google below.',
  google: "Google sign-in didn't work. Please try again.",
  captcha: 'Please complete the captcha and try again.',
  'invalid-link': 'That confirmation link is invalid or has expired. Sign in to request a new one.'
};

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function SignInPage({ searchParams }: { searchParams: { error?: string; redirect?: string } }) {
  const redirectTo = searchParams?.redirect || '/account';
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gray-50 px-6 py-14">
      <div className="w-full max-w-sm">
        <p className="text-center text-lg font-semibold text-blue-700 mb-1">Vacay in Barcelona</p>
        <h1 className="text-center text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Welcome back — sign in to view your bookings.</p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          {errorMessage ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">{errorMessage}</p>
          ) : null}

          <a
            href={`/api/auth/google?redirect=${encodeURIComponent(redirectTo)}`}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 py-2.5 rounded-lg"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
            </svg>
            Continue with Google
          </a>

          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-[11px] text-gray-400">or</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input type="email" name="email" required className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Password</label>
              <input type="password" name="password" required className="input" />
            </div>

            {RECAPTCHA_SITE_KEY ? <RecaptchaWidget siteKey={RECAPTCHA_SITE_KEY} /> : null}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg">
              Sign in
            </button>
          </form>
        </div>

        <p className="text-sm text-gray-500 text-center mt-5">
          New here?{' '}
          <Link href={`/account/sign-up?redirect=${encodeURIComponent(redirectTo)}`} className="text-blue-600 font-medium hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
