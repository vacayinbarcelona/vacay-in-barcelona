'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IconSearch } from '@/components/ui/Icons';

type Suggestion = { slug: string; name: string; categoryLabel: string; heroImageUrl: string; heroImageAlt: string };

export function HeroSearchBar() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debounced fetch — waits 250ms after the user stops typing before
  // hitting the API, so we're not firing a request on every keystroke.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        setSuggestions(data.results ?? []);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Close the dropdown on outside click.
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function goToAttraction(slug: string) {
    setOpen(false);
    router.push(`/attractions/${slug}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    // If there's exactly one obvious match, go straight there; otherwise
    // fall back to the full attractions list, filtered by the search term.
    if (suggestions.length > 0) {
      goToAttraction(suggestions[0].slug);
    } else {
      router.push(`/attractions?q=${encodeURIComponent(trimmed)}`);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <input
          name="q"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search Sagrada Família, Park Güell…"
          autoComplete="off"
          className="w-full bg-white rounded-full pl-6 pr-14 py-4 text-sm text-gray-700 placeholder:text-gray-400 shadow-xl outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:text-gray-700"
        >
          <IconSearch className="h-5 w-5" />
        </button>
      </form>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {loading ? (
            <p className="px-5 py-4 text-sm text-gray-400">Searching…</p>
          ) : suggestions.length > 0 ? (
            <ul>
              {suggestions.map((s) => (
                <li key={s.slug}>
                  <button
                    type="button"
                    onClick={() => goToAttraction(s.slug)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {s.heroImageUrl ? (
                        <Image src={s.heroImageUrl} alt={s.heroImageAlt} fill sizes="40px" className="object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      {s.categoryLabel ? <p className="text-xs text-gray-400 truncate">{s.categoryLabel}</p> : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-4 text-sm text-gray-400">No matches for &ldquo;{query.trim()}&rdquo;</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
