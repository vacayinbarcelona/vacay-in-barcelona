// Shared view-model types used by presentational components.
// These are intentionally narrower than the full Prisma model — each page
// selects only the fields it needs and passes that shape down.

export type AttractionCardData = {
  slug: string;
  name: string;
  categoryLabel: string;
  badge: string;
  shortDescription: string;
  heroImageUrl: string;
  heroImageAlt: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  currency: string;
  durationLabel: string;
  freeCancellation: boolean;
  mobileTicket: boolean;
};

export type TourCardData = AttractionCardData & {
  highlightBullets: string[];
};

export type BlogPostCardData = {
  slug: string;
  title: string;
  excerpt: string;
  content: string; // needed client-side only to estimate reading time on cards
  featuredImageUrl: string;
  featuredImageAlt: string;
  authorName: string;
  category: string;
  publishedAt: Date | null;
};

// Lean shape passed into the client-side booking widget — only what the
// calendar/checkout UI actually needs, not the full Prisma row.
export type TicketOptionData = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  durationLabel: string;
  freeCancellation: boolean;
  mobileTicket: boolean;
  instantConfirmation: boolean;
  languages: string; // comma-separated, e.g. "English, Spanish"
  groupType: string;
  badge: string;
  imageUrl: string;
  imageAlt: string;
  supplierName: string; // empty = house product, otherwise "Sold by <supplierName>"
};

// Passed into the booking modal/provider so it knows which attraction the
// active booking belongs to and which checkout rules apply.
export type BookingAttractionContext = {
  slug: string;
  name: string;
  currency: string;
  requiresAllTravelerNames: boolean;
  meetingAddress: string;
  mapUrl: string;
};

// One line item in the shopping cart — added from an attraction page once a
// date/time/language/traveler count has been chosen in the availability
// modal. Traveler *names* (when required) and guest contact details are
// collected once, together, at /checkout — not per item — so adding
// several tickets to the cart stays quick.
export type CartItem = {
  id: string; // client-generated id for this cart line, independent of any DB id
  attractionSlug: string;
  attractionName: string;
  imageUrl: string;
  imageAlt: string;
  requiresAllTravelerNames: boolean;
  ticketOptionId: string;
  ticketOptionName: string;
  date: string; // ISO date, e.g. "2026-08-14"
  timeSlot: string;
  language: string;
  adults: number;
  children: number;
  pricePerAdult: number;
  pricePerChild: number;
  currency: string;
};
