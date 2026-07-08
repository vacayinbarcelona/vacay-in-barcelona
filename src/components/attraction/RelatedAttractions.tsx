import Link from 'next/link';
import { CompactAttractionCard } from '@/components/attraction/CompactAttractionCard';
import type { AttractionCardData } from '@/types';

export function RelatedAttractions({ attractions }: { attractions: AttractionCardData[] }) {
  const shown = attractions.slice(0, 3);
  if (shown.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-6 py-10 border-t border-gray-100">
      <div className="flex items-end justify-between mb-6">
        <h2 className="text-xl font-semibold">Explore more of Barcelona</h2>
        <Link href="/attractions" className="text-blue-600 text-sm font-medium whitespace-nowrap">
          See more experiences &rarr;
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {shown.map((a) => (
          <CompactAttractionCard key={a.slug} attraction={a} />
        ))}
      </div>
    </section>
  );
}
