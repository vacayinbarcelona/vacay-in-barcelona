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
      <div className="relative h-[52vh] sm:h-[54vh] min-h-[420px] max-h-[600px] overflow-hidden">
        <Image
          src="/images/site/hero-barcelona.jpg"
          alt="View over Barcelona from Park Güell, with the Sagrada Família and the sea in the distance"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

        <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-6 pt-10 pb-14 sm:pb-16">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300/70 bg-white/5 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wider text-white mb-2.5">
            <IconStar className="h-3 w-3 text-amber-400" />
            #1 BARCELONA TICKET &amp; TOUR MARKETPLACE
          </span>

          <h1 className="text-white text-3xl sm:text-5xl font-semibold max-w-3xl leading-[1.08]">
            Barcelona awaits.
            <br />
            <span className="text-amber-400">Unforgettable</span> experiences.
          </h1>

          <p className="text-white/90 text-sm sm:text-base mt-2 max-w-xl">
            Book top attractions, tours and experiences in Barcelona. Instant confirmation, free cancellation and
            secure checkout.
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-amber-300/70 text-amber-300">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-white/90 text-xs leading-tight max-w-[6rem]">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-3 text-white/90 text-xs sm:text-sm">
            <span className="flex items-center gap-0.5 text-amber-400">
              <IconStar className="h-3.5 w-3.5" />
              <IconStar className="h-3.5 w-3.5" />
              <IconStar className="h-3.5 w-3.5" />
              <IconStar className="h-3.5 w-3.5" />
              <IconStar className="h-3.5 w-3.5 text-amber-400/50" />
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
    <div className="max-w-5xl mx-auto px-6 -mt-7 sm:-mt-8 relative z-10">
      <form
        action="/attractions"
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-[2fr_1.3fr_1fr_auto] gap-2.5"
      >
        <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200">
          <IconSearch className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">I want to explore</span>
            <input
              name="q"
              type="text"
              placeholder="Search Sagrada Família, Park Güell…"
              className="block w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            />
          </span>
        </label>

        <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200">
          <IconCalendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">Date</span>
            <input name="date" type="date" className="block w-full text-sm text-gray-700 outline-none" />
          </span>
        </label>

        <label className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200">
          <IconUser className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="flex-1">
            <span className="block text-[11px] font-medium text-blue-600 leading-none mb-1">Travelers</span>
            <select name="travelers" className="block w-full text-sm text-gray-700 outline-none bg-transparent">
              <option>1 adult</option>
              <option>2 adults</option>
              <option>3 adults</option>
              <option>4 adults</option>
            </select>
          </span>
        </label>

        <div className="flex items-center">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-2.5 rounded-xl"
          >
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
