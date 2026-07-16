import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget';
import { submitSupplierApplication } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Please fill in your company name, contact name, email, and select at least one category.',
  'invalid-email': 'Please enter a valid email address.',
  'rate-limited': "You've submitted a few applications already — please wait a few minutes and try again.",
  captcha: 'Please complete the captcha and try again.',
  exists: 'An application with this email already exists. Contact us if you need to check its status.'
};

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Become a Supplier — Vacay in Barcelona',
    description: 'Apply to list your Barcelona tickets, tours, or experiences on Vacay in Barcelona.'
  };
}

export default async function BecomeASupplierPage({ searchParams }: { searchParams: { submitted?: string; error?: string } }) {
  const submitted = searchParams?.submitted === '1';
  const errorMessage = searchParams?.error ? ERROR_MESSAGES[searchParams.error] : null;

  // Every category (Attraction) is offered here, published or not — the
  // Master Admin controls what's actually live separately, and may want to
  // start lining up suppliers for a category before it launches.
  const categories = await prisma.attraction.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, categoryLabel: true }
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-2">Become a supplier</h1>
      <p className="text-sm text-gray-500 mb-8">
        List your Barcelona tickets, tours, or experiences on Vacay in Barcelona. Apply below and our team will review
        your application — once approved, you&rsquo;ll get access to your own supplier panel to manage your products.
      </p>

      {submitted ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-sm text-green-700">
          Thanks for applying! Our team will review your application and email you at the address you provided once a
          decision has been made.
        </div>
      ) : (
        <form action={submitSupplierApplication} className="space-y-5">
          {errorMessage ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{errorMessage}</p>
          ) : null}

          {/* Honeypot — hidden from real visitors, but simple bots that
              auto-fill every field will fill this in too. */}
          <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
            <label htmlFor="company">Company</label>
            <input id="company" name="company" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Company name</label>
              <input name="companyName" required className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Contact name</label>
              <input name="contactName" required className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
              <input type="email" name="email" required className="input" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
              <input name="phone" className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Website / social profile <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input name="website" className="input" placeholder="https://" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-2 block">
              Which categories would you like to sell in?
            </label>
            <div className="space-y-2">
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5">
                  <input type="checkbox" name="categoryIds" value={c.id} className="h-4 w-4" />
                  <span>
                    {c.name}
                    {c.categoryLabel ? <span className="text-gray-400"> — {c.categoryLabel}</span> : null}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tell us about your business <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              name="message"
              rows={4}
              className="input"
              placeholder="What tickets/tours do you offer, and what makes them worth listing?"
            />
          </div>

          {RECAPTCHA_SITE_KEY ? <RecaptchaWidget siteKey={RECAPTCHA_SITE_KEY} /> : null}

          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
            Submit application
          </button>
        </form>
      )}
    </div>
  );
}
