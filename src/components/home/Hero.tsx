import Image from 'next/image';
import { IconSearch, IconCalendar, IconUser, IconStar, IconTag, IconBolt, IconLock } from '@/components/ui/Icons';

const TRUST_ITEMS = [
  { icon: IconTag, label: 'Best Price Guarantee' },
  { icon: IconCalendar, label: 'Free Cancellation' },
  { icon: IconBolt, label: 'Instant Confirmation' },
  { icon: IconLock, label: 'Secure Booking' }
];

export function Hero() {
  return (
    <section className="relative">
      <div className="relative min-h-[600px] sm:min-h-[680px] overflow-hidden">
        <Image
          src="/images/site/hero-barcelona.jpg"
          alt="View over Barcelona from Park Güell, with the Sagrada Família and the sea in the distance"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-black/20" />

        <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-6 pt-24 pb-24 sm:pb-28">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300/70 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold tracking-wider text-white mb-5">
            <IconStar className="h-3.5 w-3.5 text-amber-400" />
            #1 BARCELONA TICKET &amp; TOUR MARKETPLACE
          </span>

          <h1 className="text-white text-4xl sm:text-6xl font-semibold max-w-3xl leading-[1.1]">
            Barcelona awaits.
            <br />
            <span className="text-amber-400">Unforgettable</span>
            <br />
            experiences.
          </h1>

          <p className="text-white/90 text-base sm:text-lg mt-4 max-w-xl">
            Book top attractions, tours and experiences in Barcelona. Instant confirmation, free cancellation and
            secure checkout.
          </p>

          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-7">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-amber-300/70 text-amber-300">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-white/90 text-sm leading-tight max-w-[6.5rem]">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-6 text-white/90 text-sm">
            <span className="flex items-center gap-0.5 text-amber-400">
              <IconStar className="h-4 w-4" />
              <IconStar className="h-4 w-4" />
              <IconStar className="h-4 w-4" />
              <IconStar className="h-4 w-4" />
              <IconStar className="h-4 w-4 text-amber-400/50" />
            </span>
            <span className="font-medium">4.8</span>
            <span className="text-white/50">|</span>
            <span>65,000+ tickets booked</span>
          </div>
        </div>
      </div>

      <HeroSearchBar />
    </section>
  );
}

function HeroSearchBar() {
  return (
    <div className="max-w-5xl mx-auto px-6 -mt-14 sm:-mt-16 relative z-10">
      <form
        action="/attractions"
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[2fr_1.3fr_1fr_auto] gap-3"
      >
        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <IconSearch className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">I want to explore</span>
            <input
              name="q"
              type="text"
              placeholder="Search Sagrada Família, Park Güell…"
              className="block w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            />
            <span className="block text-[11px] text-gray-400 mt-1">Attraction, tour or experience</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <IconCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">Date</span>
            <input name="date" type="date" className="block w-full text-sm text-gray-700 outline-none" />
            <span className="block text-[11px] text-gray-400 mt-1">Select date</span>
          </span>
        </label>

        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <IconUser className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">Travelers</span>
            <select name="travelers" className="block w-full text-sm text-gray-700 outline-none bg-transparent">
              <option>1 adult</option>
              <option>2 adults</option>
              <option>3 adults</option>
              <option>4 adults</option>
            </select>
            <span className="block text-[11px] text-gray-400 mt-1">Add travelers</span>
          </span>
        </label>

        <div className="relative flex items-start sm:items-center">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-xl"
          >
            Search
          </button>
          <span className="hidden sm:flex absolute -bottom-7 right-1 items-center gap-1 text-blue-600 text-xs italic font-medium whitespace-nowrap">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 -scale-x-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 8c-4 0-9 2-9 8M11 16l-3-3M11 16l-3 3" />
            </svg>
            Find your experience
          </span>
        </div>
      </form>
    </div>
  );
}
