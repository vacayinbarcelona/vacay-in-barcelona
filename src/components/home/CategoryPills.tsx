const CATEGORIES = [
  'Gaudí architecture',
  'Skip-the-line tickets',
  'Walking tours',
  'Shows & flamenco',
  'Football & Camp Nou'
];

export function CategoryPills() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-4">
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-medium px-4 py-2 rounded-full bg-blue-600 text-white">All attractions</span>
        {CATEGORIES.map((label) => (
          <span key={label} className="text-xs font-medium px-4 py-2 rounded-full bg-gray-100 text-gray-600">
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
