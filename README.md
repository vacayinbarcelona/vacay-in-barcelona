# Vacay in Barcelona

An independent ticket and tour marketplace for Barcelona attractions — Sagrada Família, Park Güell, Casa Batlló,
Casa Milà, Camp Nou, walking tours, and flamenco shows. Built with Next.js (App Router), TypeScript, Tailwind CSS,
and Prisma.

This is not the official website of any attraction listed. Bookings are completed directly on this site (no
redirect to a third-party checkout).

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Prisma ORM** — SQLite for local dev, swap to Postgres for production (see [Deploying](#deploying))
- **Resend** — transactional email (booking confirmations, contact form)
- Cart state lives in the browser (`localStorage`) — no user accounts required to book

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the values — see below
npm run db:push        # creates the local SQLite database from prisma/schema.prisma
npm run db:seed        # loads the 7 attractions with real content/photos
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the site and
[http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel (log in with `ADMIN_EMAIL` /
`ADMIN_PASSWORD` from `.env`).

### Environment variables

See `.env.example` for the full list with comments. The essentials to get running locally:

| Variable | Required for | Notes |
|---|---|---|
| `DATABASE_URL` | Everything | Defaults to a local SQLite file, zero setup |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `/admin` login | Pick anything for local dev |
| `SESSION_SECRET` | `/admin` login | Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | SEO metadata, sitemap | `http://localhost:3000` locally |
| `RESEND_API_KEY` / `EMAIL_FROM` | Real confirmation/contact emails | Optional locally — the site works without it, it just won't send real emails (errors are logged, not thrown) |

Not yet wired up (see [What's not real yet](#whats-not-real-yet)):

| Variable | For |
|---|---|
| `REZDY_API_KEY` | Real-time ticket availability + reservation |
| `STRIPE_SECRET_KEY` | Real payment capture |

## Project structure

```
prisma/schema.prisma          Data model (Attraction, TicketOption, Order, Booking, ...)
prisma/seed.ts                Seed data for the 7 Barcelona attractions
public/images/                Real photos, organized by attraction slug

src/app/
  page.tsx                    Homepage
  attractions/[slug]/         Attraction detail page (one template drives all attractions)
  cart/                       Cart page
  checkout/                   Checkout page + createOrder server action
  booking-confirmation/[reference]/   Order confirmation page
  about-us/, contact-us/, privacy-policy/,
  terms-conditions/, affiliate-disclosure/    Legal & static pages
  admin/                       Admin panel (see below)
  sitemap.ts, robots.ts       SEO

src/components/
  home/                        Homepage sections
  attraction/                  Attraction page sections + booking modal
  cart/                        CartProvider (localStorage-backed cart context)
  admin/                       Admin UI helpers (delete confirm, etc.)
  seo/                         JSON-LD structured data helper
  layout/, ui/                 Header, Footer, icons, rating

src/lib/
  db.ts                        Prisma client singleton
  auth.ts                      Admin session (signed cookie, no external auth library)
  email.ts                     Order confirmation email (Resend)
  availability.ts              Demo calendar/time-slot generator (→ Rezdy later)
  ics.ts                       "Add to calendar" file generator
  format.ts, slugify.ts        Small formatting helpers
```

## How booking works

1. On an attraction page, picking a ticket opens a modal to choose date, time, language, and traveler count, then
   **adds it to the cart** (not an instant checkout — you can add tickets from several attractions before paying).
2. `/cart` — review everything, remove items, see the total.
3. `/checkout` — collects traveler names once for the whole cart (only for attractions that require full ID-matched
   names per traveler — see `Attraction.requiresAllTravelerNames`, currently only Sagrada Família), one lead
   traveler/contact section, and payment. Submitting calls `createOrder()`.
4. `createOrder()` (`src/app/checkout/actions.ts`) creates one `Order` row with a `Booking` row per cart item,
   sends a confirmation email, and returns an order reference.
5. `/booking-confirmation/[reference]` shows the confirmed order — one card per ticket, each with its own QR code
   and meeting point.

## Admin panel

`/admin` (guarded by the cookie session from `src/lib/auth.ts`):

- **Attractions** — create/edit/delete listings: core details, pricing, SEO fields, the
  `requiresAllTravelerNames` toggle, ticket options, gallery photos, highlights/included/important-info, FAQs, and
  reviews.
- **Bookings** — read-only list and detail view of every order.

Every save revalidates the homepage and that attraction's live page immediately.

## What's not real yet

This is a fully working booking flow end to end (cart → checkout → order → confirmation email), but two pieces are
intentionally stubbed until you're ready to go live — both are flagged with `TODO` comments at the relevant spots:

- **Availability** (`src/lib/availability.ts`) — generates a plausible demo calendar (some days sold out, three
  time slots/day) instead of calling a real inventory API. Swap in a Rezdy (or similar) call here; keep the same
  return shape and the calendar UI doesn't need to change.
- **Payment** — checkout collects card fields but doesn't charge anything (`src/app/checkout/actions.ts`). Wire up
  a real provider (Stripe is the natural fit) before taking real bookings.

## Deploying

- Swap `DATABASE_URL` to a real Postgres instance (Neon, Supabase, Vercel Postgres, etc.) and change the
  `datasource` provider in `prisma/schema.prisma` from `sqlite` to `postgresql`, then `npx prisma db push`.
- Set `NEXT_PUBLIC_SITE_URL` to your real domain (used by metadata, the sitemap, and Open Graph tags).
- Set a real `RESEND_API_KEY` + verified sending domain for confirmation/contact emails.
- Generate a fresh `SESSION_SECRET` and set real `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
