import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative">
      <div className="relative h-[460px] sm:h-[560px] overflow-hidden">
        <Image
          src="/images/site/hero-barcelona.jpg"
          alt="View over Barcelona from Park Güell, with the Sagrada Família and the sea in the distance"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
        <div className="relative max-w-7xl mx-auto h-full flex flex-col justify-center px-6 pb-16">
          <p className="text-orange-300 text-sm font-semibold tracking-wider mb-3">
            #1 BARCELONA TICKET &amp; TOUR MARKETPLACE
          </p>
          <h1 className="text-white text-4xl sm:text-6xl font-semibold max-w-3xl leading-[1.1]">
            Skip the line. See it all.
          </h1>
          <p className="text-white/90 text-base sm:text-lg mt-4 max-w-xl">
            Real-time availability, instant confirmation, and secure checkout — every Barcelona ticket and tour
            booked directly on our site.
          </p>
          <div className="flex items-center gap-6 mt-6 text-white/90 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-amber-400">★★★★★</span> 4.8 average rating
            </div>
            <div className="hidden sm:block">65,000+ tickets booked</div>
          </div>
        </div>
      </div>

      <HeroSearchBar />
    </section>
  );
}

function HeroSearchBar() {
  return (
    <div className="max-w-5xl mx-auto px-6 -mt-10 sm:-mt-12 relative z-10">
      <form
        action="/attractions"
        className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-[2fr_1.3fr_1fr_auto] gap-3"
      >
        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span className="flex-1">
            <span className="block text-[11px] text-gray-400 leading-none mb-1">Attraction or tour</span>
            <input
              name="q"
              type="text"
              placeholder="Search Sagrada Família, Park Güell…"
              className="block w-full text-sm text-gray-700 placeholder:text-gray-400 outline-none"
            />
          </span>
        </label>

        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="flex-1">
            <span className="block text-[11px] text-gray-400 leading-none mb-1">Date</span>
            <input name="date" type="date" className="block w-full text-sm text-gray-700 outline-none" />
          </span>
        </label>

        <label className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-4-4 4 4 0 004 4z" />
          </svg>
          <span className="flex-1">
            <span className="block text-[11px] text-gray-400 leading-none mb-1">Travelers</span>
            <select name="travelers" className="block w-full text-sm text-gray-700 outline-none bg-transparent">
              <option>1 adult</option>
              <option defaultValue="2 adults">2 adults</option>
              <option>3 adults</option>
              <option>4 adults</option>
            </select>
          </span>
        </label>

        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-3 rounded-xl"
        >
          Search
        </button>
      </form>
    </div>
  );
}
