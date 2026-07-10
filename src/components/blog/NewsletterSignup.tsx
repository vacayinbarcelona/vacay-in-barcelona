import { subscribeToNewsletter } from '@/app/blog/actions';
import { IconMail } from '@/components/ui/Icons';

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-email': 'Please enter a valid email address.',
  'rate-limited': "You've tried a few times already — please wait a few minutes and try again.",
  '1': 'Something went wrong — please try again.'
};

export function NewsletterSignup({ redirectTo, subscribed, error }: { redirectTo: string; subscribed?: boolean; error?: string }) {
  return (
    <div className="rounded-3xl bg-gray-900 text-white px-6 py-10 sm:px-12 sm:py-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-4">
        <IconMail className="h-5 w-5" />
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold">Get Barcelona in your inbox</h2>
      <p className="text-white/60 text-sm mt-2 max-w-md mx-auto">
        New guides, seasonal tips, and the occasional discount code — no spam, unsubscribe any time.
      </p>

      {subscribed ? (
        <p className="mt-6 text-sm font-medium text-emerald-400">You&rsquo;re on the list — thanks for subscribing!</p>
      ) : (
        <form action={subscribeToNewsletter} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto mt-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          {/* Honeypot — hidden from real visitors */}
          <div className="absolute -left-[9999px]" aria-hidden="true">
            <label htmlFor="newsletter-company">Company</label>
            <input id="newsletter-company" name="company" tabIndex={-1} autoComplete="off" />
          </div>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            className="flex-1 rounded-full px-5 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 rounded-full whitespace-nowrap">
            Subscribe
          </button>
        </form>
      )}
      {error ? <p className="mt-3 text-sm text-red-400">{ERROR_MESSAGES[error] ?? ERROR_MESSAGES['1']}</p> : null}
    </div>
  );
}
