import fs from 'fs';
import path from 'path';
import Image from 'next/image';
import { IconTag, IconUser, IconLock, IconHeart } from '@/components/ui/Icons';

function imageExists(publicPath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), 'public', publicPath));
}

const FEATURES = [
  {
    icon: IconTag,
    title: 'Top Attractions',
    description: 'Sagrada Família, Park Güell, Casa Batlló and more.',
    image: '/images/attractions/sagrada-familia/hero.jpg',
    alt: 'The Sagrada Família basilica in Barcelona'
  },
  {
    icon: IconUser,
    title: 'Curated Experiences',
    description: 'Walking tours, day trips, flamenco shows & more.',
    image: '/images/attractions/barcelona-walking-tours/hero.jpg',
    alt: 'A small group on a guided walking tour in Barcelona'
  },
  {
    icon: IconLock,
    title: 'Trusted & Secure',
    description: 'Secure payments and 24/7 customer support.',
    // Drop a photo at public/images/site/feature-support.jpg (square, ~600x600) to replace this placeholder.
    image: '/images/site/feature-support.jpg',
    alt: 'A customer support agent ready to help'
  },
  {
    icon: IconHeart,
    title: 'Loved by Travelers',
    description: 'Thousands of happy travelers every day.',
    // Drop a photo at public/images/site/feature-travelers.jpg (square, ~600x600) to replace this placeholder.
    image: '/images/site/feature-travelers.jpg',
    alt: 'Travelers enjoying a view over Barcelona'
  }
];

export function FeatureStrip() {
  return (
    <section className="max-w-7xl mx-auto px-6 mt-4 pb-3">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-2 lg:grid-cols-4 divide-y-0 divide-x divide-gray-100">
        {FEATURES.map(({ icon: Icon, title, description, image, alt }) => (
          <div key={title} className="flex items-center gap-3 p-3 sm:p-4">
            <div className="flex-1 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-1.5">
                <Icon className="h-4 w-4" />
              </span>
              <p className="font-semibold text-xs sm:text-sm text-gray-900">{title}</p>
              <p className="hidden sm:block text-[11px] text-gray-500 mt-0.5 leading-snug">{description}</p>
            </div>
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center">
              {imageExists(image) ? (
                <Image src={image} alt={alt} fill sizes="48px" className="object-cover" />
              ) : (
                <Icon className="h-5 w-5 text-blue-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
