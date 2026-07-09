import Image from 'next/image';
import { IconCalendar, IconStar, IconTag, IconBolt, IconLock } from '@/components/ui/Icons';
import { HeroSearchBar } from './HeroSearchBar';

const TRUST_ITEMS = [
  { icon: IconTag, label: 'Best Price Guarantee' },
  { icon: IconCalendar, label: 'Free Cancellation' },
  { icon: IconBolt, label: 'Instant Confirmation' },
  { icon: IconLock, label: 'Secure Booking' }
];

export function Hero() {
  return (
    <section className="relative h-[54vh] sm:h-[58vh] min-h-[440px] max-h-[620px]">
      {/* Background image layer — overflow-hidden lives here only, so it
          crops the photo/gradients but never clips content in the layer
          below. Previously overflow-hidden wrapped the search bar too,
          which silently cut off its suggestions dropdown on short mobile
          viewports (it looked like the dropdown was rendering "behind" the
          next section, but it was actually just clipped at the hero's
          bottom edge). */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/site/hero-barcelona.jpg"
          alt="View over Barcelona from Park Güell, with the Sagrada Família and the sea in the distance"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
      </div>

      {/* Content layer — no overflow-hidden, so the search dropdown can
          extend past the hero's visual bottom edge without being clipped. */}
      <div className="absolute inset-0">
        <div className="relative max-w-7xl mx-auto h-full flex flex-col lg:flex-row lg:items-center gap-6 px-6 pt-6 pb-6">
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-amber-300/70 bg-white/5 backdrop-blur-sm px-3 py-1 text-[11px] font-semibold tracking-wider text-white mb-2">
              <IconStar className="h-3 w-3 text-amber-400" />
              #1 BARCELONA TICKET &amp; TOUR MARKETPLACE
            </span>

            <h1 className="text-white text-3xl sm:text-4xl font-semibold max-w-3xl leading-[1.08]">
              Barcelona awaits.
              <br />
              <span className="text-amber-400">Unforgettable</span> experiences.
            </h1>

            <p className="text-white/90 text-sm mt-2 max-w-xl">
              Book top attractions, tours and experiences in Barcelona. Instant confirmation, free cancellation and
              secure checkout.
            </p>

            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
              {TRUST_ITEMS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-amber-300/70 text-amber-300">
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="text-white/90 text-xs leading-tight max-w-[6rem]">{label}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-2 text-white/90 text-xs sm:text-sm">
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

          <div className="w-full lg:w-[340px] flex-shrink-0">
            <HeroSearchBar />
          </div>
        </div>
      </div>
    </section>
  );
}
