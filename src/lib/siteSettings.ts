import { prisma } from '@/lib/db';

// Thin wrapper around the SiteSetting key/value table — used for admin-
// editable SEO title/description on the homepage and static legal pages.
// Attraction pages don't use this; they have their own metaTitle/
// metaDescription columns on the Attraction model.

export async function getSiteSettings(keys: string[]): Promise<Record<string, string>> {
  if (keys.length === 0) return {};
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return map;
}

export async function setSiteSetting(key: string, value: string): Promise<void> {
  if (value) {
    await prisma.siteSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  } else {
    // Empty value means "use the built-in default" — don't clutter the
    // table with empty-string rows.
    await prisma.siteSetting.deleteMany({ where: { key } });
  }
}

// The set of pages whose SEO title/description can be edited from
// /admin/seo. `key` is the SiteSetting key prefix; `defaultTitle` /
// `defaultDescription` are what's used when no override is saved.
export const SEO_PAGES = [
  {
    key: 'home',
    label: 'Homepage',
    path: '/',
    defaultTitle: 'Vacay in Barcelona — Attraction Tickets & Tours',
    defaultDescription:
      'Independent marketplace for Barcelona attraction tickets and tours. Compare Sagrada Família, Park Güell, Casa Batlló and more, with real-time availability and secure checkout.'
  },
  {
    key: 'attractions',
    label: 'Attractions listing',
    path: '/attractions',
    defaultTitle: 'Attractions in Barcelona — Tickets & Tours',
    defaultDescription:
      "Compare tickets for Barcelona's must-see landmarks — Sagrada Família, Park Güell, Casa Batlló, Casa Milà, Camp Nou and more — with skip-the-line access and free cancellation."
  },
  {
    key: 'tours',
    label: 'Tours & tickets listing',
    path: '/tours',
    defaultTitle: 'Tours & Tickets in Barcelona',
    defaultDescription:
      "Every ticket and guided experience Vacay in Barcelona offers, in one place — compare products across all of Barcelona's top attractions, tours and shows."
  },
  {
    key: 'blog',
    label: 'Blog listing',
    path: '/blog',
    defaultTitle: 'Barcelona Travel Blog — Tips, Guides & Things to Do',
    defaultDescription:
      'Guides, itineraries, and insider tips for visiting Barcelona — from must-see landmarks to hidden gems, written to help you plan the perfect trip.'
  },
  {
    key: 'about-us',
    label: 'About us',
    path: '/about-us',
    defaultTitle: 'About us',
    defaultDescription:
      'Vacay in Barcelona is an independent marketplace for Barcelona attraction tickets and tours — not an official attraction website.'
  },
  {
    key: 'contact-us',
    label: 'Contact us',
    path: '/contact-us',
    defaultTitle: 'Contact us',
    defaultDescription: 'Get in touch with Vacay in Barcelona about a booking, a general question, or feedback.'
  },
  {
    key: 'privacy-policy',
    label: 'Privacy policy',
    path: '/privacy-policy',
    defaultTitle: 'Privacy policy',
    defaultDescription: 'How Vacay in Barcelona collects, uses, and protects your information.'
  },
  {
    key: 'terms-conditions',
    label: 'Terms & conditions',
    path: '/terms-conditions',
    defaultTitle: 'Terms & conditions',
    defaultDescription: 'The terms that apply when you book a ticket or tour through Vacay in Barcelona.'
  },
  {
    key: 'affiliate-disclosure',
    label: 'Affiliate disclosure',
    path: '/affiliate-disclosure',
    defaultTitle: 'Affiliate disclosure',
    defaultDescription: 'How Vacay in Barcelona works with ticketing and tour partners.'
  }
] as const;

export type SeoPageKey = (typeof SEO_PAGES)[number]['key'];

export async function getSeoMetadataFor(pageKey: SeoPageKey): Promise<{ title: string; description: string }> {
  const page = SEO_PAGES.find((p) => p.key === pageKey);
  if (!page) throw new Error(`Unknown SEO page key: ${pageKey}`);

  const settings = await getSiteSettings([`seo.${pageKey}.title`, `seo.${pageKey}.description`]);
  return {
    title: settings[`seo.${pageKey}.title`] || page.defaultTitle,
    description: settings[`seo.${pageKey}.description`] || page.defaultDescription
  };
}
