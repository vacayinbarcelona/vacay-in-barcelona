/**
 * Seed script — populates the database with the initial Barcelona catalogue:
 * Sagrada Família, Park Güell, Casa Batlló, Casa Milà / La Pedrera, Camp Nou,
 * Barcelona walking tours, and Flamenco shows in Barcelona.
 *
 * Images live in /public/images/attractions/<slug>/ (hero.jpg + gallery-N.jpg).
 * These are real photos you supplied. Add more via Admin > Attraction > Images,
 * or drop additional files in the matching folder and reference them here.
 *
 * Run with: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function img(slug: string, file: string) {
  return `/images/attractions/${slug}/${file}`;
}

type SeedAttraction = {
  slug: string;
  name: string;
  category: 'attraction' | 'tour' | 'show';
  categoryLabel: string;
  badge?: string;
  tagline?: string;
  requiresAllTravelerNames?: boolean;
  shortDescription: string;
  longDescription: string;
  heroImageAlt: string;
  rating: number;
  reviewCount: number;
  priceFrom: number;
  durationLabel: string;
  address: string;
  featured: boolean;
  popularTour: boolean;
  sortOrder: number;
  metaTitle: string;
  metaDescription: string;
  ticketOptions: Array<{
    name: string;
    description: string;
    price: number;
    durationLabel: string;
    freeCancellation?: boolean;
    mobileTicket?: boolean;
    languages?: string;
    groupType?: string;
    badge?: string;
    affiliateProvider?: string;
    // Product-specific details — different per ticket option, only shown
    // after booking (confirmation page + email), never on the public page.
    // When omitted, falls back to the attraction's shared included/
    // notIncluded/importantInfo/address below, so nothing is left empty —
    // but Sagrada Família's three tickets set these explicitly as the
    // worked example (see the admin panel's "Tickets & tours" section).
    meetingPoint?: string;
    included?: string[];
    notIncluded?: string[];
    beforeYouGo?: string[];
  }>;
  highlights: string[];
  included: string[];
  notIncluded: string[];
  importantInfo: string[];
  faqs: Array<{ q: string; a: string }>;
  reviews: Array<{ name: string; country: string; rating: number; title: string; comment: string }>;
  galleryFiles: string[];
  quickFacts?: Array<{ icon: 'column' | 'landmark' | 'people' | 'camera'; title: string; subtitle: string }>;
};

const data: SeedAttraction[] = [
  {
    slug: 'sagrada-familia',
    name: 'Sagrada Família',
    category: 'attraction',
    categoryLabel: 'Architecture & landmarks',
    badge: 'Best seller',
    tagline: "Gaudí's Masterpiece",
    requiresAllTravelerNames: true,
    shortDescription:
      "Antoni Gaudí's unfinished masterpiece and Barcelona's most iconic landmark — a basilica unlike anything else on Earth.",
    longDescription:
      "The Sagrada Família is Antoni Gaudí's legendary basilica, under construction since 1882 and still rising over Barcelona's Eixample district. Inside, forest-like columns branch into a canopy of stone while stained glass floods the nave in shifting color.\n\nGaudí devoted the final years of his life to the project, and his design blends Gothic and Art Nouveau ideas into something entirely his own. The basilica was declared a UNESCO World Heritage Site in 2005, and its towers offer sweeping views over the city once you reach the top.\n\nBecause it remains one of the most visited monuments in Spain, tickets for a specific time slot are strongly recommended — queues without a booked entry can run well over an hour, especially in summer.",
    heroImageAlt: 'Sagrada Família basilica towers rising above Barcelona',
    rating: 4.8,
    reviewCount: 18420,
    priceFrom: 30,
    durationLabel: '1–1.5 hours',
    address: "Carrer de Mallorca, 401, 08013 Barcelona, Spain",
    featured: true,
    popularTour: false,
    sortOrder: 1,
    metaTitle: 'Sagrada Família Tickets & Tours — Skip the Line | Vacay in Barcelona',
    metaDescription:
      'Book Sagrada Família tickets with skip-the-line entry, tower access, and guided tours. Free cancellation on most options. Compare prices and book instantly.',
    ticketOptions: [
      {
        name: 'Skip-the-Line Entry Ticket',
        description: 'Timed entry to the basilica interior with an audio guide app included.',
        price: 30,
        durationLabel: '1 hour',
        languages: 'English, Spanish, French, German, Italian',
        badge: 'Best seller',
        affiliateProvider: 'Partner network',
        meetingPoint: 'Nativity Façade entrance, Carrer de la Marina — look for the "Skip-the-line" sign, no ticket office queue.',
        included: ['Timed entry to the basilica', 'Official audio guide (app-based)', 'Access to the museum in the crypt'],
        notIncluded: ['Tower access', 'Hotel pickup and drop-off', 'Food and drinks'],
        beforeYouGo: [
          'Arrive 15 minutes before your slot — latecomers may not be guaranteed entry.',
          'Shoulders and knees should be covered as it remains an active place of worship.',
          'Security screening is required at entry — bags may be inspected.'
        ]
      },
      {
        name: 'Entry + Nativity or Passion Tower',
        description: 'Basilica entry plus lift access to one of the towers for panoramic city views.',
        price: 44,
        durationLabel: '1.5 hours',
        languages: 'English, Spanish',
        badge: 'Popular',
        affiliateProvider: 'Partner network',
        meetingPoint: 'Passion Façade entrance, Carrer de Sardenya — tower groups meet 10 minutes before their slot.',
        included: ['Timed entry to the basilica', 'Official audio guide (app-based)', 'Lift access to your chosen tower'],
        notIncluded: ['Hotel pickup and drop-off', 'Food and drinks'],
        beforeYouGo: [
          'Arrive 15 minutes before your slot — latecomers may not be guaranteed entry.',
          'Tower access involves a narrow spiral staircase — not recommended for those with mobility issues.',
          'Large bags and luggage are not allowed on the tower route.'
        ]
      },
      {
        name: 'Guided Tour with Skip-the-Line Access',
        description: 'Small-group guided tour with a local expert, followed by time to explore independently.',
        price: 55,
        durationLabel: '2 hours',
        groupType: 'Small group (max 20)',
        languages: 'English, Spanish',
        affiliateProvider: 'Partner network',
        meetingPoint: 'Meet your guide at Plaça de Gaudí, opposite the Nativity Façade — look for the guide holding a "Vacay in Barcelona" sign.',
        included: ['Skip-the-line basilica entry', 'Small-group guided tour with a local expert', 'Free time to explore independently after the tour'],
        notIncluded: ['Tower access', 'Hotel pickup and drop-off', 'Gratuities (optional)'],
        beforeYouGo: [
          'Arrive 10 minutes before the meeting time — the group departs promptly.',
          'Shoulders and knees should be covered as it remains an active place of worship.',
          'A lightweight earpiece is provided so you can hear your guide in busy areas.'
        ]
      }
    ],
    highlights: [
      "Marvel at Gaudí's forest-like columns and kaleidoscopic stained glass",
      'Skip the general admission line with a timed-entry ticket',
      'Optional tower access for panoramic views over Barcelona',
      'Learn the story behind Europe’s longest-running construction project',
      'UNESCO World Heritage Site since 2005'
    ],
    included: ['Timed entry to the basilica', 'Official audio guide (app-based)', 'Access to the museum in the crypt'],
    notIncluded: ['Hotel pickup and drop-off', 'Tower access (unless selected)', 'Food and drinks'],
    importantInfo: [
      'Arrive 15–30 minutes before your slot; latecomers may not be guaranteed entry.',
      'Shoulders and knees should be covered as it remains an active place of worship.',
      'Tower access involves a narrow spiral staircase and is not recommended for those with mobility issues.',
      'Security screening is required at entry — bags may be inspected.',
      'Tickets are date- and time-specific and cannot be exchanged for a different slot on arrival.'
    ],
    faqs: [
      {
        q: 'Do I need to book Sagrada Família tickets in advance?',
        a: 'Yes. Entry is by timed slot and walk-up availability is very limited, especially April–October. Booking ahead guarantees your preferred time.'
      },
      {
        q: 'How long should I plan to spend inside?',
        a: 'Most visitors spend 45–60 minutes in the basilica itself, plus 30–45 minutes more if you add tower access.'
      },
      {
        q: 'Is the Sagrada Família wheelchair accessible?',
        a: 'The main basilica level is accessible via lift. The towers, however, are only reachable by narrow stairs and are not wheelchair accessible.'
      },
      {
        q: 'Can I cancel or change my ticket?',
        a: 'Most options on this page offer free cancellation up to 24 hours before your slot — check the specific option for its cancellation policy before booking.'
      }
    ],
    reviews: [
      {
        name: 'Emma R.',
        country: 'United Kingdom',
        rating: 5,
        title: 'Breathtaking, worth every minute',
        comment: 'Photos genuinely do not do this place justice. The stained glass windows change the entire mood of the interior depending on where you stand. Skip-the-line entry saved us at least an hour.'
      },
      {
        name: 'Marco B.',
        country: 'Italy',
        rating: 5,
        title: 'Tower access is worth the extra cost',
        comment: 'Went up the Passion Tower and the views over the city were incredible. The staircase down is tight and spiral, so wear good shoes.'
      },
      {
        name: 'Priya S.',
        country: 'India',
        rating: 4,
        title: 'Stunning but plan your time slot carefully',
        comment: 'Absolutely stunning building. We nearly missed our slot because of traffic — arrive early, there is a security line even with a timed ticket.'
      }
    ],
    galleryFiles: ['gallery-1.jpg', 'gallery-2.jpg', 'gallery-3.jpg', 'gallery-4.jpg'],
    quickFacts: [
      { icon: 'column', title: 'Built over 140 years', subtitle: 'Still under construction' },
      { icon: 'landmark', title: 'UNESCO World Heritage', subtitle: 'A masterpiece by Gaudí' },
      { icon: 'people', title: '4.5M+ Visitors Every Year', subtitle: "Barcelona's top attraction" },
      { icon: 'camera', title: 'Unforgettable Views', subtitle: 'Inside and out' }
    ]
  },
  {
    slug: 'park-guell',
    name: 'Park Güell',
    category: 'attraction',
    categoryLabel: 'Parks & gardens',
    tagline: "Gaudí's Fairy-Tale Park",
    shortDescription:
      "A fairy-tale public park where Gaudí's mosaic-covered terraces and gingerbread pavilions overlook the whole city.",
    longDescription:
      "Perched on a hill above Barcelona, Park Güell began in 1900 as a private garden-city commissioned by Eusebi Güell and designed by Antoni Gaudí. The project as housing failed, and the city later turned it into a public park — leaving behind one of the most photographed spots in Barcelona.\n\nThe Monumental Zone is home to the famous trencadís mosaic salamander, the wave-shaped tiled bench overlooking the city, and the columned Hypostyle Room originally intended as a market.\n\nOutside the ticketed zone, the rest of the park is free to wander and offers some of the best panoramic viewpoints in the city, including Turó de les Tres Creus.",
    heroImageAlt: 'Colorful mosaic terrace at Park Güell overlooking Barcelona',
    rating: 4.6,
    reviewCount: 12980,
    priceFrom: 18,
    durationLabel: '1–2 hours',
    address: '08024 Barcelona, Spain',
    featured: true,
    popularTour: false,
    sortOrder: 2,
    metaTitle: 'Park Güell Tickets & Guided Tours | Vacay in Barcelona',
    metaDescription:
      "Book Park Güell Monumental Zone tickets or a guided walking tour. Compare prices, skip the line, and see Gaudí's mosaic masterpiece.",
    ticketOptions: [
      {
        name: 'Monumental Zone Entry Ticket',
        description: 'Timed entry to the Monumental Zone, home to the mosaic terrace and iconic salamander.',
        price: 18,
        durationLabel: '1 hour',
        languages: 'Self-guided',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Guided Walking Tour of Park Güell',
        description: 'Local guide covers Gaudí’s design philosophy and the park’s unusual history.',
        price: 32,
        durationLabel: '1.5 hours',
        groupType: 'Small group (max 15)',
        languages: 'English, Spanish',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Park Güell + Gaudí House Museum Combo',
        description: 'Monumental Zone entry plus the house where Gaudí lived for nearly 20 years.',
        price: 24,
        durationLabel: '2 hours',
        languages: 'Self-guided',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'See the iconic trencadís mosaic salamander and tiled serpentine bench',
      "Explore Gaudí's Hypostyle Room with its forest of stone columns",
      'Panoramic views over Barcelona and out to the Mediterranean',
      'Learn how a failed housing project became a beloved public park',
      'Combine with a visit to the Gaudí House Museum'
    ],
    included: ['Timed entry to the Monumental Zone', 'Access to viewpoints within the ticketed area'],
    notIncluded: ['Gaudí House Museum (unless selected)', 'Transport to the park', 'Guide (unless selected)'],
    importantInfo: [
      'The Monumental Zone has a daily visitor cap — book ahead, especially in peak season.',
      'The park involves stairs and sloped paths; comfortable shoes are recommended.',
      'Free areas of the park (outside the Monumental Zone) remain open without a ticket.',
      'Drones and professional photography equipment require prior authorization.'
    ],
    faqs: [
      {
        q: 'Is all of Park Güell paid entry?',
        a: 'No — only the Monumental Zone requires a ticket. The rest of the park, including several viewpoints, is free and open to everyone.'
      },
      {
        q: 'How do I get to Park Güell?',
        a: 'The park sits on a hill outside the city center. Metro L3 (Vallcarca or Lesseps) plus a 10–15 minute walk, or a direct bus, are the most common routes.'
      },
      {
        q: 'Is Park Güell suitable for strollers or wheelchairs?',
        a: 'Parts of the Monumental Zone are hilly with steps. There is a step-free route, but it is longer — ask staff at the entrance to point you to it.'
      }
    ],
    reviews: [
      {
        name: 'Sofia K.',
        country: 'Greece',
        rating: 5,
        title: 'The views alone are worth it',
        comment: 'Even without the mosaics this would be worth the trip just for the skyline views. Go right at opening to avoid the crowds on the main terrace.'
      },
      {
        name: 'Tom H.',
        country: 'Australia',
        rating: 4,
        title: 'Beautiful but very busy',
        comment: 'Booked the first slot of the day and it was still fairly crowded on the bench area. Still, the colors and craftsmanship are incredible up close.'
      },
      {
        name: 'Laura M.',
        country: 'France',
        rating: 5,
        title: 'Guide made a big difference',
        comment: 'We did the guided tour and learned so much about Gaudí and Güell’s failed housing project — made the visit far more interesting than just walking through.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'column', title: 'Built in 1900', subtitle: 'Originally a private garden-city' },
      { icon: 'landmark', title: 'UNESCO World Heritage', subtitle: 'A masterpiece by Gaudí' },
      { icon: 'people', title: '4M+ Visitors Every Year', subtitle: "One of Barcelona's top parks" },
      { icon: 'camera', title: 'Best City Views', subtitle: 'Panoramas over Barcelona' }
    ]
  },
  {
    slug: 'casa-batllo',
    name: 'Casa Batlló',
    category: 'attraction',
    categoryLabel: 'Architecture & landmarks',
    badge: 'Recommended',
    tagline: 'The House of Bones',
    shortDescription:
      'A dragon-scaled, bone-balconied masterpiece on Passeig de Gràcia — one of Gaudí’s most surreal residential works.',
    longDescription:
      "Casa Batlló is Antoni Gaudí's 1904 renovation of an existing townhouse into one of the most surreal buildings in Barcelona. Locals nicknamed it \"the house of bones\" for its skeletal balconies, and the shimmering, scaled roofline is widely read as a tribute to the legend of Saint George and the dragon.\n\nInside, barely a straight line survives — door frames curve like waves, stairwells shift from deep blue to white as they rise, and the light well was engineered so daylight reaches every floor evenly.\n\nToday the building runs an immersive multimedia experience alongside the architecture itself, making it one of the more theatrical Gaudí visits in the city.",
    heroImageAlt: "Casa Batlló's colorful mosaic facade and dragon-scale roof",
    rating: 4.7,
    reviewCount: 9840,
    priceFrom: 35,
    durationLabel: '1–1.5 hours',
    address: 'Passeig de Gràcia, 43, 08007 Barcelona, Spain',
    featured: true,
    popularTour: false,
    sortOrder: 3,
    metaTitle: 'Casa Batlló Tickets — Skip the Line | Vacay in Barcelona',
    metaDescription:
      "Compare Casa Batlló ticket options including standard and immersive experiences. Free cancellation available. Book Gaudí's dragon house in minutes.",
    ticketOptions: [
      {
        name: 'Blue Ticket — Standard Entry',
        description: 'Self-guided visit with the standard multimedia guide included.',
        price: 35,
        durationLabel: '1 hour',
        languages: 'Multilingual audio guide',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Gold Ticket — Immersive Experience',
        description: 'Priority entry plus the enhanced augmented-reality multimedia experience and rooftop access.',
        price: 45,
        durationLabel: '1.5 hours',
        languages: 'Multilingual audio guide',
        badge: 'Recommended',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Be The First — Early Access',
        description: 'Enter before public opening hours for a quieter visit and photos without the crowds.',
        price: 49,
        durationLabel: '1.5 hours',
        languages: 'Multilingual audio guide',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'Walk through Gaudí’s "house of bones" on the elegant Passeig de Gràcia',
      'See the dragon-scale roof and shifting blue-tiled light well',
      'Enjoy an immersive multimedia storytelling experience',
      'Access the rooftop terrace with its chimney sculptures',
      'One of only three UNESCO-listed Gaudí houses open to the public'
    ],
    included: ['Entry ticket', 'Multimedia guide', 'Rooftop terrace access'],
    notIncluded: ['Early access (unless Be The First selected)', 'Hotel pickup', 'Food and drinks'],
    importantInfo: [
      'Some stairways are narrow — those with mobility difficulties should check accessibility options in advance.',
      'A lift is available for most of the visit; ask staff for the accessible route.',
      'Tickets are date- and time-specific.',
      'Large backpacks and suitcases are not permitted inside.'
    ],
    faqs: [
      {
        q: 'What is the difference between Blue and Gold tickets?',
        a: 'The Gold ticket adds priority entry and an enhanced augmented-reality storytelling layer to the standard multimedia guide included with the Blue ticket.'
      },
      {
        q: 'How long does a Casa Batlló visit take?',
        a: 'Most visitors spend 60–90 minutes exploring at their own pace, including the rooftop.'
      },
      {
        q: 'Is Casa Batlló accessible for wheelchairs and strollers?',
        a: 'Yes, a lift covers most of the visitor route, though a few sections have narrow passages — staff can direct you to the most accessible path.'
      }
    ],
    reviews: [
      {
        name: 'Daniel W.',
        country: 'United States',
        rating: 5,
        title: 'The AR experience is genuinely impressive',
        comment: 'The Gold ticket\'s augmented reality really brings the rooms to life — you point your device and see how Gaudí imagined the space. Worth the upgrade.'
      },
      {
        name: 'Nina P.',
        country: 'Netherlands',
        rating: 5,
        title: 'Stunning color and light',
        comment: 'The staircase light well is one of the most photogenic things I’ve seen in Barcelona. Not a straight line anywhere in the building.'
      },
      {
        name: 'Carlos F.',
        country: 'Mexico',
        rating: 4,
        title: 'Great but busy midday',
        comment: 'Went at 1pm and it was quite crowded. Booking the early access slot next time based on other reviews.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'column', title: 'Renovated in 1904', subtitle: 'Gaudí transformed an existing house' },
      { icon: 'landmark', title: 'UNESCO World Heritage', subtitle: 'A masterpiece by Gaudí' },
      { icon: 'people', title: '1M+ Visitors Every Year', subtitle: 'On Passeig de Gràcia' },
      { icon: 'camera', title: 'Immersive Experience', subtitle: 'Multimedia tour included' }
    ]
  },
  {
    slug: 'casa-mila-la-pedrera',
    name: 'Casa Milà / La Pedrera',
    category: 'attraction',
    categoryLabel: 'Architecture & landmarks',
    tagline: 'The Stone Quarry',
    shortDescription:
      "Gaudí's undulating stone facade and otherworldly rooftop chimneys — nicknamed \"La Pedrera,\" the stone quarry.",
    longDescription:
      "Completed in 1912, Casa Milà was Antoni Gaudí's last major civil work before he devoted himself entirely to the Sagrada Família. Locals nicknamed it \"La Pedrera\" (the quarry) for its rippling, undressed-stone facade — a radical departure from anything else on Passeig de Gràcia at the time.\n\nThe rooftop is the highlight for most visitors: warrior-like chimneys and stairwell exits sculpted into abstract, almost sci-fi forms, with the Sagrada Família visible on the skyline beyond.\n\nInside, the Espai Gaudí attic and a furnished apartment show how the building's structural innovations — a self-supporting stone facade with no load-bearing walls — let Gaudí break entirely from conventional floor plans.",
    heroImageAlt: "Casa Milà's rippling stone facade and sculptural rooftop chimneys",
    rating: 4.6,
    reviewCount: 7210,
    priceFrom: 28,
    durationLabel: '1–1.5 hours',
    address: 'Passeig de Gràcia, 92, 08008 Barcelona, Spain',
    featured: true,
    popularTour: false,
    sortOrder: 4,
    metaTitle: 'Casa Milà (La Pedrera) Tickets & Rooftop Access | Vacay in Barcelona',
    metaDescription:
      "Book Casa Milà / La Pedrera tickets including day visits, day+night combos, and sunset rooftop access. Compare prices and book instantly.",
    ticketOptions: [
      {
        name: 'Day Visit — Standard Entry',
        description: 'Full self-guided access to the rooftop, attic, and furnished apartment.',
        price: 28,
        durationLabel: '1 hour',
        languages: 'Multilingual audio guide',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: "Gaudí's Pedrera — Day & Night",
        description: 'Standard day access plus the evening multimedia and light show on the rooftop.',
        price: 48,
        durationLabel: '2 hours',
        languages: 'Multilingual',
        badge: 'Popular',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Rooftop at Sunset',
        description: 'Evening timed entry focused on the rooftop chimneys as the sun sets over the city.',
        price: 39,
        durationLabel: '1 hour',
        languages: 'Self-guided',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'Walk among Gaudí’s sculptural, almost otherworldly rooftop chimneys',
      'See the self-supporting stone facade with no load-bearing walls',
      'Visit a furnished early-1900s apartment inside the building',
      'Learn about Gaudí’s structural innovations in the Espai Gaudí attic',
      'Optional evening light show on the rooftop terrace'
    ],
    included: ['Entry ticket', 'Audio guide', 'Access to rooftop, attic, and show apartment'],
    notIncluded: ['Night show (unless selected)', 'Hotel pickup', 'Food and drinks'],
    importantInfo: [
      'Rooftop access can close temporarily in poor weather for safety reasons.',
      'The rooftop surface is uneven — comfortable, flat shoes are recommended.',
      'Night visits are a separate timed session from day tickets.',
      'Tickets are date- and time-specific.'
    ],
    faqs: [
      {
        q: 'Is the rooftop always open?',
        a: 'The rooftop closes temporarily during heavy rain or high winds for visitor safety. Check conditions before booking an outdoor-focused slot like Rooftop at Sunset.'
      },
      {
        q: 'What is the Day & Night ticket?',
        a: 'It combines standard daytime access with a separate evening session that includes a multimedia light and sound installation on the rooftop.'
      },
      {
        q: 'How does Casa Milà compare to Casa Batlló?',
        a: 'Both are Gaudí residential buildings on the same street. Casa Milà is known for its stone facade and sculptural rooftop; Casa Batlló for its colorful mosaic facade and immersive indoor experience. Many visitors do both.'
      }
    ],
    reviews: [
      {
        name: 'Hannah L.',
        country: 'Germany',
        rating: 5,
        title: 'The chimneys are like nothing else',
        comment: 'They genuinely look like sculptures from another planet. The self-supporting facade explanation in the attic made me appreciate the engineering as much as the art.'
      },
      {
        name: 'Ravi K.',
        country: 'India',
        rating: 5,
        title: 'Night visit was magical',
        comment: 'Did the day and night combo — the light show on the rooftop as the sun went down over Barcelona was one of the best moments of our trip.'
      },
      {
        name: 'Isabelle D.',
        country: 'Belgium',
        rating: 4,
        title: 'Great visit, a bit pricey for the combo',
        comment: 'Loved it but the day+night ticket is a noticeable step up in price. Worth it if you have the time, otherwise the standard day ticket covers the essentials.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'column', title: 'Built in 1912', subtitle: "Gaudí's last private commission" },
      { icon: 'landmark', title: 'UNESCO World Heritage', subtitle: 'A masterpiece by Gaudí' },
      { icon: 'people', title: 'Rooftop Chimneys', subtitle: 'The famous "stone quarry" facade' },
      { icon: 'camera', title: 'Day & Night Visits', subtitle: 'Rooftop views over the city' }
    ]
  },
  {
    slug: 'camp-nou',
    name: 'Camp Nou (FC Barcelona)',
    category: 'attraction',
    categoryLabel: 'Sports & stadiums',
    tagline: "Europe's Largest Stadium",
    shortDescription:
      "Step into Europe's largest football stadium with a behind-the-scenes tour of FC Barcelona's home turf and museum.",
    longDescription:
      "Camp Nou has been FC Barcelona's home since 1957 and remains the largest stadium in Europe by capacity. The self-guided Camp Nou Experience takes visitors through the players' tunnel, pitch-side, the dressing rooms, and the press room, alongside a museum charting the club's history and trophies.\n\nThe stadium is currently in the midst of a major renovation (the \"Espai Barça\" project), so exact route and capacity can shift — check your ticket confirmation for the latest access details before you go.\n\nOn match days, seeing FC Barcelona play live at Camp Nou is one of the most sought-after sporting experiences in Europe, and tickets sell out well in advance for major fixtures.",
    heroImageAlt: 'Camp Nou stadium, home of FC Barcelona',
    rating: 4.5,
    reviewCount: 6430,
    priceFrom: 29,
    durationLabel: '1.5–2 hours',
    address: "C. d'Arístides Maillol, 12, 08028 Barcelona, Spain",
    featured: true,
    popularTour: false,
    sortOrder: 5,
    metaTitle: 'Camp Nou Tour & FC Barcelona Match Tickets | Vacay in Barcelona',
    metaDescription:
      'Book the Camp Nou Experience stadium tour, immersive AR tour, or FC Barcelona match tickets. Compare options and book your visit today.',
    ticketOptions: [
      {
        name: 'Camp Nou Experience — Stadium Tour',
        description: 'Self-guided tour through the tunnel, pitch-side, dressing rooms, and museum.',
        price: 29,
        durationLabel: '1.5 hours',
        languages: 'Multilingual audio guide',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Camp Nou Immersive Tour',
        description: 'Adds augmented-reality tablet content that recreates historic match moments as you walk the route.',
        price: 44,
        durationLabel: '2 hours',
        languages: 'Multilingual',
        badge: 'Popular',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'FC Barcelona Match Day Ticket',
        description: 'Official match tickets for an upcoming FC Barcelona home fixture — seat category varies by availability.',
        price: 89,
        durationLabel: 'Match duration (~2 hours)',
        languages: 'N/A',
        badge: 'Subject to fixture calendar',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'Walk through the players’ tunnel onto the edge of the pitch',
      'Explore the dressing rooms and press conference room',
      'Visit the FC Barcelona museum and its trophy collection',
      'Optional augmented-reality tour with historic match highlights',
      'Option to see FC Barcelona play live on a match day'
    ],
    included: ['Entry ticket', 'Audio guide (stadium tour options)', 'Museum access'],
    notIncluded: ['Transport to the stadium', 'Match tickets (unless selected)', 'Food and drinks'],
    importantInfo: [
      'The stadium is undergoing renovation — the exact tour route may vary from what is described here; check your confirmation email for current details.',
      'Match day tickets are subject to the official fixture calendar and can sell out quickly for major games.',
      'Bag restrictions apply on match days for security reasons.',
      'Tour tickets are date- and time-specific.'
    ],
    faqs: [
      {
        q: 'Is the Camp Nou tour affected by the ongoing renovation?',
        a: 'Some areas may be temporarily inaccessible or the route adjusted during construction phases. Your ticket confirmation will include the latest access information for your visit date.'
      },
      {
        q: 'Can I buy match tickets for a specific FC Barcelona game?',
        a: 'Match availability depends on the official fixture calendar. Select "FC Barcelona Match Day Ticket" and choose from the fixtures shown at checkout.'
      },
      {
        q: 'How long does the stadium tour take?',
        a: 'Plan for about 90 minutes for the standard tour, or up to 2 hours with the immersive AR add-on and museum.'
      }
    ],
    reviews: [
      {
        name: 'James O.',
        country: 'Ireland',
        rating: 5,
        title: 'A must for any football fan',
        comment: 'Walking out of the tunnel onto the pitch level gives you a real sense of the scale of the place. The museum trophy room is also seriously impressive.'
      },
      {
        name: 'Yuki T.',
        country: 'Japan',
        rating: 4,
        title: 'Good tour, some areas closed for renovation',
        comment: 'A couple of sections were closed while we visited due to construction, but staff were upfront about it beforehand and it was still a great visit.'
      },
      {
        name: 'Diego A.',
        country: 'Argentina',
        rating: 5,
        title: 'Match day was unforgettable',
        comment: 'Got tickets for a home match through this and the atmosphere was incredible. Definitely arrive early to explore the stadium beforehand.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'column', title: 'Opened in 1957', subtitle: "FC Barcelona's home ground" },
      { icon: 'landmark', title: '99,000+ Seats', subtitle: 'Largest stadium in Europe' },
      { icon: 'people', title: 'Museum & Trophy Room', subtitle: "Club's full history on display" },
      { icon: 'camera', title: 'Pitch-Side Access', subtitle: "Walk through the players' tunnel" }
    ]
  },
  {
    slug: 'barcelona-walking-tours',
    name: 'Barcelona Walking Tours',
    category: 'tour',
    categoryLabel: 'Walking tours',
    badge: 'Small group',
    tagline: 'See the City on Foot',
    shortDescription:
      "Explore the Gothic Quarter, Gaudí landmarks, and hidden corners of Barcelona on foot with a local guide.",
    longDescription:
      "Barcelona rewards slow exploration on foot — narrow medieval lanes in the Gothic Quarter open onto Roman ruins, hidden squares, and centuries-old churches that are easy to miss without a guide.\n\nOur walking tour options range from a classic old-town history walk to a Gaudí-focused architecture route through the Eixample, plus an evening food-and-tapas walk through some of the city's best-loved local spots.\n\nEach tour is led by a local guide and capped at a small group size, so you can ask questions and actually see and hear everything along the way.",
    heroImageAlt: 'Narrow medieval street in the Gothic Quarter, Barcelona',
    rating: 4.7,
    reviewCount: 5310,
    priceFrom: 22,
    durationLabel: '2–3.5 hours',
    address: 'Meeting points vary by tour — Barcelona city center',
    featured: false,
    popularTour: true,
    sortOrder: 6,
    metaTitle: 'Barcelona Walking Tours — Gothic Quarter, Gaudí & Tapas | Vacay in Barcelona',
    metaDescription:
      'Compare Barcelona walking tour options: Gothic Quarter history, Gaudí architecture highlights, and evening tapas walks. Small groups, local guides.',
    ticketOptions: [
      {
        name: 'Gothic Quarter Walking Tour',
        description: 'Wander medieval lanes, Roman ruins, and the Barcelona Cathedral with a local historian guide.',
        price: 22,
        durationLabel: '2 hours',
        groupType: 'Small group (max 15)',
        languages: 'English, Spanish',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Gaudí Highlights Walking Tour',
        description: "Walk the Eixample and Passeig de Gràcia to see Gaudí's exteriors, including Casa Batlló and Casa Milà.",
        price: 26,
        durationLabel: '2.5 hours',
        groupType: 'Small group (max 15)',
        languages: 'English, Spanish, French',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Tapas & Old Town Evening Walk',
        description: 'An evening food walk through the old town with tastings at three local spots.',
        price: 65,
        durationLabel: '3.5 hours',
        groupType: 'Small group (max 12)',
        languages: 'English',
        badge: 'Includes food',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'Explore the medieval lanes and hidden squares of the Gothic Quarter',
      "See Gaudí's most famous facades along Passeig de Gràcia",
      'Small groups led by knowledgeable local guides',
      'Evening tapas walk with tastings at family-run spots',
      'Flexible options to match your schedule and interests'
    ],
    included: ['Local guide', 'Route and commentary in your selected language', 'Food tastings (tapas walk only)'],
    notIncluded: ['Attraction entry tickets (Gothic Quarter/Gaudí tours)', 'Additional food and drinks beyond tastings', 'Hotel pickup'],
    importantInfo: [
      'Wear comfortable walking shoes — routes cover 2–4 km depending on the tour.',
      'Tours run rain or shine; a light rain jacket is recommended in wetter months.',
      'Meeting point details are sent after booking.',
      'Group sizes are capped, so popular time slots can sell out in advance.'
    ],
    faqs: [
      {
        q: 'Do walking tours include entry to attractions like Casa Batlló?',
        a: 'No — walking tours cover the exteriors and neighborhood context. If you want interior access, book a dedicated attraction ticket separately (or combine both).'
      },
      {
        q: 'How much walking is involved?',
        a: 'Routes typically cover 2–4 km at a relaxed pace with regular stops, so most fitness levels can comfortably join.'
      },
      {
        q: 'Are the tours suitable for children?',
        a: 'Yes, the Gothic Quarter and Gaudí tours are family-friendly. The evening tapas walk is better suited to adults given the later timing and food/drink focus.'
      }
    ],
    reviews: [
      {
        name: 'Grace L.',
        country: 'Canada',
        rating: 5,
        title: 'Our favorite thing we did in Barcelona',
        comment: 'Our guide knew every hidden corner of the Gothic Quarter and had great stories about the Roman ruins we would have totally missed on our own.'
      },
      {
        name: 'Ahmed S.',
        country: 'UAE',
        rating: 5,
        title: 'Great overview before visiting Gaudí sites',
        comment: 'Did the Gaudí highlights walk on day one and it helped us decide which interiors were worth booking for the rest of the trip.'
      },
      {
        name: 'Beatriz C.',
        country: 'Portugal',
        rating: 4,
        title: 'Tapas walk was delicious',
        comment: 'Really fun evening, great food at every stop. Would have liked a little more time at the last venue but overall a great experience.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'people', title: 'Small Groups', subtitle: 'Local guides, capped group sizes' },
      { icon: 'landmark', title: 'Gothic Quarter & Beyond', subtitle: 'History, Gaudí and hidden corners' },
      { icon: 'column', title: 'Multiple Routes', subtitle: 'History, architecture and food walks' },
      { icon: 'camera', title: 'On-Foot Discovery', subtitle: 'See spots most visitors miss' }
    ]
  },
  {
    slug: 'flamenco-shows-barcelona',
    name: 'Flamenco Shows in Barcelona',
    category: 'show',
    categoryLabel: 'Shows & entertainment',
    badge: 'Live tablao',
    tagline: 'Passion, Rhythm, Tradition',
    shortDescription:
      'Experience the passion and rhythm of live flamenco at intimate venues across Barcelona.',
    longDescription:
      "Flamenco originated in Andalusia, but Barcelona has a thriving scene of intimate tablaos where you can experience it up close — live guitar, powerful vocals, and dancers performing just a few feet from your table.\n\nShows typically run 45–60 minutes and are often paired with a drink or a full tapas dinner, making for a memorable evening out. Venues range from small, traditional tablaos to larger theater-style stages.\n\nBecause the best tablaos are small by design, seating is limited and popular evening slots can sell out — especially on weekends.",
    heroImageAlt: 'Flamenco dancer performing live on stage in Barcelona',
    rating: 4.6,
    reviewCount: 4120,
    priceFrom: 25,
    durationLabel: '1–2 hours',
    address: 'Venues across Barcelona — see individual listings',
    featured: false,
    popularTour: true,
    sortOrder: 7,
    metaTitle: 'Flamenco Shows in Barcelona — Tickets & Dinner Options | Vacay in Barcelona',
    metaDescription:
      'Book flamenco show tickets in Barcelona, with options including a drink, tapas dinner, or front-row seating. Compare venues and book instantly.',
    ticketOptions: [
      {
        name: 'Flamenco Show + 1 Drink',
        description: 'Standard seating for a live 45-minute flamenco performance, includes one drink.',
        price: 25,
        durationLabel: '1 hour',
        languages: 'N/A',
        badge: 'Best seller',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Flamenco Show + Tapas Dinner',
        description: 'Reserved table with a multi-course tapas dinner followed by the live show.',
        price: 59,
        durationLabel: '2 hours',
        languages: 'N/A',
        badge: 'Popular',
        affiliateProvider: 'Partner network'
      },
      {
        name: 'Front Row Flamenco + Sangria',
        description: 'Premium front-row seating with a jug of sangria for the table.',
        price: 39,
        durationLabel: '1 hour',
        languages: 'N/A',
        affiliateProvider: 'Partner network'
      }
    ],
    highlights: [
      'Live guitar, vocals, and dance in an intimate tablao setting',
      'Choose from drink-only, dinner, or front-row packages',
      'Central venues, easy to combine with an evening out',
      'Authentic performances by professional flamenco artists',
      'Great for couples, small groups, and solo travelers alike'
    ],
    included: ['Show entry and reserved seating', 'Drink or dinner as specified in your chosen option'],
    notIncluded: ['Transport to the venue', 'Additional drinks beyond your package', 'Hotel pickup'],
    importantInfo: [
      'Arrive 20–30 minutes early — latecomers may not be admitted once the show starts.',
      'Dress code is smart casual at most venues.',
      'Photography without flash is usually permitted; check venue rules on arrival.',
      'Seating is limited, so popular evening slots sell out, especially Friday and Saturday.'
    ],
    faqs: [
      {
        q: 'How long does a flamenco show last?',
        a: 'Most performances run 45–60 minutes. Dinner packages extend the full evening to around 2 hours including the meal.'
      },
      {
        q: 'Is flamenco suitable for children?',
        a: 'Yes, most tablaos welcome children, though the atmosphere (live music, later evening slots) suits older kids better than infants.'
      },
      {
        q: 'What is a tablao?',
        a: 'A tablao is a small, traditional flamenco venue — typically an intimate room where the audience sits close to the stage, unlike a large theater performance.'
      }
    ],
    reviews: [
      {
        name: 'Olivia N.',
        country: 'United States',
        rating: 5,
        title: 'Goosebumps the whole show',
        comment: 'The passion in the dancing and singing was incredible — we were seated close enough to feel the energy of the guitar. Highly recommend the front row option.'
      },
      {
        name: 'Lukas F.',
        country: 'Austria',
        rating: 4,
        title: 'Great show, dinner was good too',
        comment: 'Did the dinner package. Food was solid tapas, not fine dining, but the show more than made up for it. Great evening overall.'
      },
      {
        name: 'Mei C.',
        country: 'Singapore',
        rating: 5,
        title: 'Intimate and authentic',
        comment: 'Loved that it felt like a real tablao and not a tourist trap. The dancers performed just a few feet from our table.'
      }
    ],
    galleryFiles: ['gallery-1.jpg'],
    quickFacts: [
      { icon: 'people', title: 'Intimate Tablaos', subtitle: 'Small, authentic venues' },
      { icon: 'landmark', title: 'Live Musicians', subtitle: 'Guitar, cante and percussion' },
      { icon: 'column', title: 'Traditional Art Form', subtitle: 'Rooted in Andalusian culture' },
      { icon: 'camera', title: 'Front-Row Energy', subtitle: 'Feel the passion up close' }
    ]
  }
];

async function main() {
  console.log('Seeding database…');

  for (const a of data) {
    await prisma.attraction.deleteMany({ where: { slug: a.slug } });

    await prisma.attraction.create({
      data: {
        slug: a.slug,
        name: a.name,
        city: 'Barcelona',
        category: a.category,
        categoryLabel: a.categoryLabel,
        badge: a.badge ?? '',
        tagline: a.tagline ?? '',
        requiresAllTravelerNames: a.requiresAllTravelerNames ?? false,
        status: 'published',
        shortDescription: a.shortDescription,
        longDescription: a.longDescription,
        heroImageUrl: img(a.slug, 'hero.jpg'),
        heroImageAlt: a.heroImageAlt,
        rating: a.rating,
        reviewCount: a.reviewCount,
        priceFrom: a.priceFrom,
        currency: 'EUR',
        durationLabel: a.durationLabel,
        freeCancellation: true,
        mobileTicket: true,
        address: a.address,
        mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.name + ' Barcelona')}`,
        featured: a.featured,
        popularTour: a.popularTour,
        sortOrder: a.sortOrder,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        ticketOptions: {
          create: a.ticketOptions.map((t, i) => {
            // Falls back to the attraction's shared included/notIncluded/
            // importantInfo/address when a ticket doesn't set its own —
            // Sagrada Família's three tickets set these explicitly as the
            // worked example; everything else gets a sensible default that
            // an admin can refine per-product later.
            const included = t.included ?? a.included;
            const notIncluded = t.notIncluded ?? a.notIncluded;
            const beforeYouGo = t.beforeYouGo ?? a.importantInfo;
            return {
              name: t.name,
              description: t.description,
              price: t.price,
              currency: 'EUR',
              durationLabel: t.durationLabel,
              freeCancellation: t.freeCancellation ?? true,
              mobileTicket: t.mobileTicket ?? true,
              instantConfirmation: true,
              languages: t.languages ?? '',
              groupType: t.groupType ?? '',
              badge: t.badge ?? '',
              affiliateUrl: `https://example-affiliate-partner.com/book?ref=vacayinbarcelona&item=${a.slug}-${i + 1}`,
              affiliateProvider: t.affiliateProvider ?? 'Partner network',
              sortOrder: i,
              meetingPoint: t.meetingPoint ?? a.address,
              includedItems: {
                create: [
                  ...included.map((text, j) => ({ text, included: true, sortOrder: j })),
                  ...notIncluded.map((text, j) => ({ text, included: false, sortOrder: 100 + j }))
                ]
              },
              infoItems: { create: beforeYouGo.map((text, j) => ({ text, sortOrder: j })) }
            };
          })
        },
        highlights: { create: a.highlights.map((text, i) => ({ text, sortOrder: i })) },
        includedItems: {
          create: [
            ...a.included.map((text, i) => ({ text, included: true, sortOrder: i })),
            ...a.notIncluded.map((text, i) => ({ text, included: false, sortOrder: 100 + i }))
          ]
        },
        infoItems: { create: a.importantInfo.map((text, i) => ({ text, sortOrder: i })) },
        faqs: { create: a.faqs.map((f, i) => ({ question: f.q, answer: f.a, sortOrder: i })) },
        reviews: {
          create: a.reviews.map((r, i) => ({
            authorName: r.name,
            authorCountry: r.country,
            rating: r.rating,
            title: r.title,
            comment: r.comment,
            visitDate: new Date(Date.now() - (i + 1) * 20 * 24 * 60 * 60 * 1000),
            sortOrder: i
          }))
        },
        images: {
          create: a.galleryFiles.map((file, i) => ({
            url: img(a.slug, file),
            altText: `${a.name} photo ${i + 1}`,
            sortOrder: i
          }))
        },
        quickFacts: {
          create: (a.quickFacts ?? []).map((f, i) => ({
            icon: f.icon,
            title: f.title,
            subtitle: f.subtitle,
            sortOrder: i
          }))
        }
      }
    });

    console.log(`  ✔ ${a.name}`);
  }

  // Default header/footer links — only seeded once (if the table is
  // empty), so re-running this script doesn't wipe out links added or
  // removed later from /admin/nav-links.
  const navLinkCount = await prisma.navLink.count();
  if (navLinkCount === 0) {
    await prisma.navLink.createMany({
      data: [
        { location: 'header', label: 'Sagrada Família', href: '/attractions/sagrada-familia', sortOrder: 0 },
        { location: 'header', label: 'Park Güell', href: '/attractions/park-guell', sortOrder: 1 },
        { location: 'header', label: 'Flamenco Shows', href: '/attractions/flamenco-shows-barcelona', sortOrder: 2 },
        { location: 'footer', label: 'Attractions', href: '/attractions', sortOrder: 0 },
        { location: 'footer', label: 'Tours & tickets', href: '/tours', sortOrder: 1 },
        { location: 'footer', label: 'About us', href: '/about-us', sortOrder: 2 },
        { location: 'footer', label: 'Contact us', href: '/contact-us', sortOrder: 3 },
        { location: 'footer', label: 'Privacy policy', href: '/privacy-policy', sortOrder: 4 },
        { location: 'footer', label: 'Terms & conditions', href: '/terms-conditions', sortOrder: 5 },
        { location: 'footer', label: 'Affiliate disclosure', href: '/affiliate-disclosure', sortOrder: 6 }
      ]
    });
    console.log('  ✔ Default header/footer nav links');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
