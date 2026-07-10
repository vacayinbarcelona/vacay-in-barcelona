import { IconList } from '@/components/ui/Icons';
import type { Heading } from '@/lib/markdown';

export function TableOfContents({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav className="border border-gray-200 rounded-2xl p-5 bg-gray-50/60">
      <p className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
        <IconList className="h-3.5 w-3.5" />
        In this article
      </p>
      <ul className="space-y-2">
        {headings.map((h) => (
          <li key={h.id} className={h.level === 3 ? 'pl-4' : ''}>
            <a href={`#${h.id}`} className="text-sm text-gray-600 hover:text-blue-700 leading-snug block">
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
