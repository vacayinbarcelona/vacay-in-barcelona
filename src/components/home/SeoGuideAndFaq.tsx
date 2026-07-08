const CATEGORY_TAGS = [
  { label: 'Gaudí architecture', highlighted: true },
  { label: 'Skip-the-line tickets', highlighted: false },
  { label: 'Walking tours', highlighted: false },
  { label: 'Shows and flamenco', highlighted: false },
  { label: 'Football and Camp Nou', highlighted: false }
];

const HOMEPAGE_FAQS = [
  {
    question: 'What is the best way to visit Sagrada Família and Park Güell?',
    answer:
      'Book timed-entry tickets in advance for both, ideally on different days or with several hours between visits, since each site rewards an unhurried visit of 60 to 90 minutes.'
  },
  {
    question: 'Do I need to book Barcelona attraction tickets in advance?',
    answer:
      'Yes. Most major sites, including Sagrada Família, Park Güell and Casa Batlló, sell out of walk-up tickets on many days, especially April through October.'
  },
  {
    question: 'Are tickets on Vacay in Barcelona refundable?',
    answer:
      'Most listings include free cancellation up to 24 hours before your time slot. The exact policy is shown on each ticket option before checkout.'
  }
];

export function SeoGuideAndFaq() {
  return (
    <section className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">Barcelona travel guide</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            Barcelona is one of Europe&apos;s most visited cities and home to seven UNESCO World Heritage Sites,
            including several of Antoni Gaudí&apos;s most celebrated buildings. From the soaring towers of the
            Sagrada Família to the mosaic terraces of Park Güell, most of the city&apos;s landmark attractions run
            on timed entry — booking ahead means skipping the line instead of standing in it.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mb-5">
            Vacay in Barcelona brings together tickets, guided tours and live shows for the city&apos;s top sights
            in one place, with real-time availability and instant confirmation. Compare entry tickets, guided
            tours and combo experiences for Sagrada Família, Park Güell, Casa Batlló, Casa Milà, Camp Nou, Gothic
            Quarter walking tours and flamenco shows — then complete your booking securely on our site.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_TAGS.map((tag) => (
              <span
                key={tag.label}
                className={
                  tag.highlighted
                    ? 'text-xs px-3 py-1.5 rounded-full bg-blue-100 text-blue-700'
                    : 'text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600'
                }
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
          {HOMEPAGE_FAQS.map((faq, i) => (
            <details
              key={faq.question}
              className={i < HOMEPAGE_FAQS.length - 1 ? 'border-b border-gray-200 py-3' : 'py-3'}
            >
              <summary className="text-sm font-medium cursor-pointer">{faq.question}</summary>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
