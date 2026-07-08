const STATS = [
  { value: '65,000+', label: 'Tickets booked' },
  { value: '4.8 / 5', label: 'Average rating' },
  { value: 'Instant', label: 'Confirmation' },
  { value: '24/7', label: 'Customer support' }
];

export function StatsBar() {
  return (
    <section className="max-w-7xl mx-auto px-6 pt-16 pb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        {STATS.map((stat) => (
          <div key={stat.label} className="p-4">
            <div className="text-2xl font-semibold text-blue-700">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
