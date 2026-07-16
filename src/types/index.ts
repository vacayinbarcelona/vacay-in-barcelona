// Shared view-model types used by presentational components.
// These are intentionally narrower than the full Prisma model — each page
// selects only the fields it needs and passes that shape down.

import type { LanguageScheduleDraft } from '@/lib/availabilitySchedule';

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
  // Real language -> date range -> weekday -> time slot -> ticket type
  // availability (see availabilitySchedule.ts) — empty array means this
  // product hasn't had any set up yet, in which case the booking modal falls
  // back to the demo calendar generator in lib/availability.ts.
  availabilitySchedules: LanguageScheduleDraft[];
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
  // For a booking made against a real Availability schedule, adults holds
  // the *total* traveler count across every ticket type and pricePerAdult is
  // the blended per-traveler price (totalPrice / adults) — children is
  // always 0 in that case. This keeps every existing adults/children/
  // pricePerAdult/pricePerChild-based total (cart subtotal, item count,
  // order total) correct without special-casing schedule vs. non-schedule
  // items. ticketBreakdown carries the real per-type detail (name, quantity,
  // price, age range) for display and for checkout's availability
  // re-validation — absent/empty for the legacy demo-calendar flow.
  adults: number;
  children: number;
  pricePerAdult: number;
  pricePerChild: number;
  currency: string;
  ticketBreakdown?: TicketBreakdownEntry[];
};

// One ticket type's quantity within a schedule-based booking — e.g.
// "Adult x2 at €45". ageFromUnit/ageToUnit are always "years" | "months" (see
// AgeUnit in availabilitySchedule.ts) but kept as plain strings here since
// this shape gets serialized to/from JSON (cart localStorage, Booking.
// ticketBreakdownJson) rather than passed as live typed objects throughout.
export type TicketBreakdownEntry = {
  name: string;
  quantity: number;
  price: number;
  ageFromValue: number;
  ageFromUnit: string;
  ageToValue: number;
  ageToUnit: string;
};
