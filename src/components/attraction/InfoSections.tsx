import { IconCheck } from '@/components/ui/Icons';

// Small presentational sections used on the attraction detail page. Kept in
// one file since each is a short, single-purpose block driven directly by
// the attraction's Prisma relations.

export function Highlights({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Highlights</h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {items.map((text, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <IconCheck className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function About({ longDescription }: { longDescription: string }) {
  const paragraphs = longDescription.split('\n\n').filter(Boolean);
  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold mb-4">About this experience</h2>
      <div className="space-y-4">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-sm text-gray-600 leading-relaxed">
            {p}
          </p>
        ))}
      </div>
    </section>
  );
}

export function IncludedList({ included, notIncluded }: { included: string[]; notIncluded: string[] }) {
  if (included.length === 0 && notIncluded.length === 0) return null;
  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold mb-4">What&apos;s included</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {included.length > 0 ? (
          <ul className="space-y-2">
            {included.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {notIncluded.length > 0 ? (
          <ul className="space-y-2">
            {notIncluded.map((text, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-500">
                <span className="text-gray-400 mt-0.5">✕</span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

export function ImportantInfo({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Important information</h2>
      <ul className="space-y-2">
        {items.map((text, i) => (
          <li key={i} className="text-sm text-gray-600 leading-relaxed pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-gray-400">
            {text}
          </li>
        ))}
      </ul>
    </section>
  );
}

export type ReviewData = {
  authorName: string;
  authorCountry: string;
  rating: number;
  title: string;
  comment: string;
};

export function ReviewsSection({ rating, reviewCount, reviews }: { rating: number; reviewCount: number; reviews: ReviewData[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="py-8 border-t border-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-lg font-semibold">Customer reviews</h2>
        <span className="text-sm text-gray-500">
          {rating.toFixed(1)} &middot; {reviewCount.toLocaleString('en-GB')} reviews
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-1 text-amber-500 text-sm mb-2">{'★'.repeat(r.rating)}</div>
            <p className="text-sm font-medium mb-1">{r.title}</p>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{r.comment}</p>
            <p className="text-[11px] text-gray-400">
              {r.authorName} &middot; {r.authorCountry}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export type FaqData = { question: string; answer: string };

export function FaqSection({ faqs }: { faqs: FaqData[] }) {
  if (faqs.length === 0) return null;
  return (
    <section className="py-8 border-t border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Frequently asked questions</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <details key={i} className="border border-gray-200 rounded-xl px-4 py-3 group">
            <summary className="text-sm font-medium cursor-pointer list-none flex items-center justify-between">
              {faq.question}
              <span className="text-gray-400 group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
