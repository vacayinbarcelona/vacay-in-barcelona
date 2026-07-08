import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/components/cart/CartProvider';
import { JsonLd } from '@/components/seo/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com';

// Site-wide structured data — tells search engines this is a business/
// marketplace, not a single article, and ties the site name to its URL for
// sitelinks search box eligibility. Per-page structured data (attractions,
// breadcrumbs, FAQs) is added on top of this in those pages.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Vacay in Barcelona',
  url: siteUrl,
  description: 'Independent marketplace for Barcelona attraction tickets and tours.'
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Vacay in Barcelona',
  url: siteUrl
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Vacay in Barcelona — Attraction Tickets & Tours',
    template: '%s | Vacay in Barcelona'
  },
  description:
    'Independent marketplace for Barcelona attraction tickets and tours. Compare Sagrada Família, Park Güell, Casa Batlló and more, with real-time availability and secure checkout.',
  openGraph: {
    type: 'website',
    siteName: 'Vacay in Barcelona',
    locale: 'en_US'
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <JsonLd data={organizationJsonLd} />
        <JsonLd data={websiteJsonLd} />
        <CartProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
