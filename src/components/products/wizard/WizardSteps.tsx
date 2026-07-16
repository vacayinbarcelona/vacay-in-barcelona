import Link from 'next/link';

const STEPS: { n: 1 | 2 | 3; label: string }[] = [
  { n: 1, label: 'Basic Info' },
  { n: 2, label: 'Meeting Point & Supplier' },
  { n: 3, label: 'Availability & Pricing' }
];

// Tab bar for the 3-step supplier product wizard. Every step's data is
// always saved as soon as it's submitted (see actions.ts), so jumping
// directly to any step is safe once the product exists (productId !== null)
// — there's no separate "how far did they get" tracking needed. Before the
// product exists (creating a brand-new one), only Step 1 is reachable.
export function WizardSteps({ productId, current }: { productId: string | null; current: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-6">
      {STEPS.map((s, i) => {
        const active = s.n === current;
        const clickable = productId !== null;
        const badgeClass = active ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500';
        const pillClass = active
          ? 'bg-blue-600 text-white'
          : clickable
            ? 'text-gray-600 hover:bg-gray-100'
            : 'text-gray-300 cursor-not-allowed';
        const content = (
          <span className={`flex items-center gap-2 text-base font-medium px-3 py-2 rounded-lg ${pillClass}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${badgeClass}`}>{s.n}</span>
            {s.label}
          </span>
        );
        return (
          <div key={s.n} className="flex items-center gap-1.5">
            {clickable ? <Link href={`/supplier/products/${productId}?step=${s.n}`}>{content}</Link> : content}
            {i < STEPS.length - 1 ? <span className="text-gray-300 text-base px-0.5">&rarr;</span> : null}
          </div>
        );
      })}
    </div>
  );
}
