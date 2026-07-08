export function Rating({ rating, reviewCount, size = 'sm' }: { rating: number; reviewCount: number; size?: 'sm' | 'md' }) {
  const textSize = size === 'md' ? 'text-sm' : 'text-xs';
  return (
    <div className={`flex items-center gap-1 ${textSize} text-gray-600`}>
      <span className="text-amber-500">★</span>
      <span className="font-medium text-gray-800">{rating.toFixed(1)}</span>
      <span className="text-gray-400">({reviewCount.toLocaleString('en-GB')})</span>
    </div>
  );
}
