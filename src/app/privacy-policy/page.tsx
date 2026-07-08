import type { Metadata } from 'next';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('privacy-policy');
  return { title, description };
}

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-2">Privacy policy</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Information we collect</h2>
          <p>
            When you book a ticket or tour, we collect the information needed to complete and confirm that booking:
            your name, email address, phone number, and — for attractions that require it (such as Sagrada Família)
            — the first and last name of every traveler on the booking, matching the ID they&apos;ll bring on the
            day. We do not collect payment card details ourselves; those are handled by our payment provider once
            live payment processing is connected.
          </p>
          <p className="mt-2">
            If you contact us through the{' '}
            <a href="/contact-us" className="text-blue-600 hover:text-blue-700 font-medium">
              contact form
            </a>
            , we collect your name, email, and message so we can respond.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Your cart</h2>
          <p>
            Items you add to your cart are stored locally in your browser (via <code>localStorage</code>), not on
            our servers, until you complete checkout. Clearing your browser data will clear your cart.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">How we use your information</h2>
          <p>We use the information above to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Create and confirm your booking, and issue your mobile ticket</li>
            <li>Send you a booking confirmation email with your ticket and order details</li>
            <li>Respond to support requests about an existing booking</li>
            <li>Meet ticketing requirements set by the attraction (e.g. ID-matched traveler names)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Who we share it with</h2>
          <p>
            We share the minimum information needed to fulfil your booking with our ticketing and tour partners, and
            with our transactional email provider (Resend) solely to deliver your confirmation email. We do not sell
            your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Data retention</h2>
          <p>
            We keep booking records for as long as needed to handle support requests, refunds, and legal or
            accounting requirements, after which they are deleted or anonymized.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Your rights</h2>
          <p>
            You can ask us what information we hold about you, request a correction, or request deletion, subject to
            our obligations to keep booking records for legal and accounting purposes. Contact us at{' '}
            <a href="/contact-us" className="text-blue-600 hover:text-blue-700 font-medium">
              our contact page
            </a>{' '}
            to make a request.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Changes to this policy</h2>
          <p>
            We may update this policy from time to time. Material changes will be reflected by updating the date at
            the top of this page.
          </p>
        </section>
      </div>
    </div>
  );
}
