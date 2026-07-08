import type { Metadata } from 'next';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('about-us');
  return { title, description };
}

export default function AboutUsPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-6">About Vacay in Barcelona</h1>

      <div className="space-y-5 text-sm text-gray-600 leading-relaxed">
        <p>
          Vacay in Barcelona is an independent ticket and tour marketplace built for one city. Instead of trying to
          cover every destination, we focus entirely on Barcelona — Sagrada Família, Park Güell, Casa Batlló, Casa
          Milà, Camp Nou, walking tours, flamenco shows, and the rest of what makes the city worth visiting — so we
          can go deeper on the details that actually help you plan a visit: real opening patterns, how long to
          budget, what&apos;s genuinely worth the upgrade, and when tickets tend to sell out.
        </p>

        <p>
          We compare ticket and tour options across each attraction, show real-time availability, and let you book
          directly on this site — no redirecting to a different checkout partway through, and no guesswork about
          whether a listing is current.
        </p>

        <h2 className="text-base font-semibold text-gray-900 pt-4">We are not an official attraction website</h2>
        <p>
          Vacay in Barcelona is not affiliated with, endorsed by, or the official website of Sagrada Família, Park
          Güell, Casa Batlló, Casa Milà, FC Barcelona, or any other attraction, venue, or operator listed on this
          site. We are a booking marketplace that works with ticketing and tour partners to offer these experiences
          in one place. Official prices and information are always available directly from each attraction as well.
        </p>

        <h2 className="text-base font-semibold text-gray-900 pt-4">What we care about</h2>
        <p>
          Clear pricing with no surprise fees at checkout, free cancellation options wherever they&apos;re available,
          mobile tickets so you&apos;re not printing anything before a trip, and support if something about your
          booking needs attention. If you run into an issue, our{' '}
          <a href="/contact-us" className="text-blue-600 hover:text-blue-700 font-medium">
            contact page
          </a>{' '}
          is the fastest way to reach us.
        </p>
      </div>
    </div>
  );
}
