import type { Metadata } from 'next';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('terms-conditions');
  return { title, description };
}

export default function TermsConditionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-2">Terms &amp; conditions</h1>
      <p className="text-xs text-gray-400 mb-8">Last updated: July 2026</p>

      <div className="space-y-6 text-sm text-gray-600 leading-relaxed">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Who we are</h2>
          <p>
            Vacay in Barcelona is an independent ticket and tour marketplace for Barcelona attractions and
            experiences. We are not affiliated with, endorsed by, or the official website of any attraction, venue,
            or operator listed on this site.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Bookings</h2>
          <p>
            When you complete checkout, you&apos;re booking directly through Vacay in Barcelona. Prices shown at
            checkout are final and include any applicable service fee — there are no surprise charges added
            afterward. Once your order is confirmed, you&apos;ll receive an order reference and a confirmation email
            with your ticket details.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Traveler information</h2>
          <p>
            Some attractions (Sagrada Família, for example) require the first and last name of every traveler on the
            booking, matching the ID they&apos;ll present at entry. It&apos;s your responsibility to provide accurate
            names at checkout — entry may be refused if the name on ID doesn&apos;t match the ticket, and this is not
            something we can control after a ticket has been issued.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Cancellations &amp; refunds</h2>
          <p>
            Cancellation terms vary by ticket option and are shown before you complete checkout. Where a ticket
            includes free cancellation, you can request a refund up to the deadline stated at booking. Tickets
            without free cancellation, and requests made after the cancellation deadline, are generally
            non-refundable, in line with the terms of the underlying attraction or tour operator. To request a
            cancellation, contact us with your order reference.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Changes by the attraction</h2>
          <p>
            Attractions occasionally change opening hours, routes, or availability (for example, due to renovation
            or maintenance) without notice to us. Where this affects a confirmed booking, we&apos;ll do our best to
            notify you and help arrange an alternative time slot or a refund.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Liability</h2>
          <p>
            We act as a booking intermediary between you and the attractions, tours, and ticketing partners listed
            on this site. We are not responsible for the condition, safety, or operation of any venue, or for
            changes made by an attraction outside of our control. Nothing in these terms limits any liability that
            cannot be limited under applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Changes to these terms</h2>
          <p>We may update these terms from time to time. Continued use of the site after changes means you accept the updated terms.</p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">Contact</h2>
          <p>
            Questions about these terms or an existing booking? Reach us via{' '}
            <a href="/contact-us" className="text-blue-600 hover:text-blue-700 font-medium">
              our contact page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
