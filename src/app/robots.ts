import type { MetadataRoute } from 'next';

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vacayinbarcelona.com').replace(/\/$/, '');

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Admin panel, cart/checkout (user-specific, no SEO value), and
      // order confirmations (private booking data) shouldn't be crawled.
      disallow: ['/admin', '/cart', '/checkout', '/booking-confirmation']
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
