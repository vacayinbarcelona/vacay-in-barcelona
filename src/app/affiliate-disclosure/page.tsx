import type { Metadata } from 'next';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('affiliate-disclosure');
  return { title, description };
}

export default function AffiliateDisclosurePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-6">Affiliate disclosure</h1>

      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        <p>
          Vacay in Barcelona is an independent marketplace, not the official website of any attraction. Every
          booking is completed directly on this site — we don&apos;t redirect you to a third-party checkout partway
          through.
        </p>

        <p>
          Behind the scenes, tickets and tours listed here are fulfilled through ticketing and tour partners
          (including, as this integrates, real-time availability providers such as Rezdy). We may earn a commission
          from these partners on bookings made through Vacay in Barcelona. This does not change the price you pay —
          the price shown at checkout is the final price, with no separate affiliate markup added on top.
        </p>

        <p>
          Because we work with partners to fulfil bookings rather than operating the attractions ourselves, we
          encourage anyone with questions about accessibility, group rates, or highly time-sensitive travel plans to
          also check the attraction&apos;s own official website directly.
        </p>

        <p>
          If anything about a listing, price, or partner relationship is unclear, we&apos;d rather you ask than
          guess — reach out via{' '}
          <a href="/contact-us" className="text-blue-600 hover:text-blue-700 font-medium">
            our contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
