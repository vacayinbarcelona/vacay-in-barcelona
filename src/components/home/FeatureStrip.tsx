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
    <section className="max-w-7xl mx-auto px-6 -mt-px pb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {FEATURES.map(({ icon: Icon, title, description, image, alt }) => (
          <div key={title} className="flex items-center gap-4 p-6">
            <div className="flex-1 min-w-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
                <Icon className="h-5 w-5" />
              </span>
              <p className="font-semibold text-sm text-gray-900">{title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <div className="relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden bg-blue-50 flex items-center justify-center">
              {imageExists(image) ? (
                <Image src={image} alt={alt} fill sizes="64px" className="object-cover" />
              ) : (
                <Icon className="h-6 w-6 text-blue-300" />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
