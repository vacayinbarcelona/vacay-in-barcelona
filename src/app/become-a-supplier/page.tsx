import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { SupplierApplicationForm } from '@/components/supplier/SupplierApplicationForm';
import { submitSupplierApplication } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Please fill in your company name, contact name, email, tax ID, registered country, and select at least one category.',
  'invalid-email': 'Please enter a valid email address.',
  'rate-limited': "You've submitted a few applications already — please wait a few minutes and try again.",
  captcha: 'Please complete the captcha and try again.',
  'exists-email': 'An application with this email already exists. Contact us if you need to check its status.',
  'exists-company': 'A supplier with this company name has already applied. Contact us if you need to check its status.',
  terms: 'Please confirm you have read the supplier terms & conditions and privacy policy.'
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
        <>
          {errorMessage ? (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-5">{errorMessage}</p>
          ) : null}
          <SupplierApplicationForm action={submitSupplierApplication} categories={categories} recaptchaSiteKey={RECAPTCHA_SITE_KEY} />
        </>
      )}
    </div>
  );
}
