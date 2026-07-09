'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// A floating confirmation toast instead of an inline banner at the top of
// the page. Two problems with the old inline version:
//   1. On long admin pages (e.g. the attraction edit page, where "Save" on
//      the Tickets section is often 1000+px down), the "Saved." message
//      rendered above everything and was invisible unless you scrolled back
//      to the top.
//   2. It was driven by a `show` boolean computed server-side from the
//      `searchParams` prop — but a redirect() from inside a Server Action
//      doesn't always reliably re-thread fresh search params down to an
//      already-mounted Server Component on the resulting client-side
//      transition, so the toast could silently never appear even though the
//      URL bar correctly showed `?saved=1`.
// Reading the query string with useSearchParams() here instead sidesteps
// both: it renders fixed to the viewport (so it's visible wherever you're
// scrolled), and it reads the *actual current URL* client-side rather than
// trusting a prop that may lag behind it.
//
// The redirect target's value is a timestamp (see redirect() calls in every
// actions.ts, e.g. `?saved=${Date.now()}`), not a constant "1". Saving
// twice in a row redirects to the *same* URL string ("?saved=1") both
// times, and Next's client-side router cache can treat that as "nothing
// changed" and skip re-rendering — which is exactly why the toast worked
// once and then went silent on every save after. A timestamp guarantees
// every save's redirect target is a genuinely new URL, so there's nothing
// for the router to dedupe.
function SavedToastInner({ paramName, message }: { paramName: string; message: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  // Depend on the *value*, not a derived boolean — two saves in a row could
  // otherwise both resolve to "show = true" without the value ever having
  // gone through a "null" in between (e.g. if the cleanup below hasn't
  // committed yet), and a boolean that never changes won't re-run the
  // effect. The raw value always changes between saves.
  const value = searchParams.get(paramName);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!value) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Strip the param from the URL so refreshing the page (or coming back
      // to it later) doesn't re-show the toast.
      const next = new URLSearchParams(searchParams.toString());
      next.delete(paramName);
      const query = next.toString();
      router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 flex-shrink-0">
        <path
          fillRule="evenodd"
          d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
          clipRule="evenodd"
        />
      </svg>
      {message}
    </div>
  );
}

export function SavedToast({ paramName = 'saved', message = 'Saved.' }: { paramName?: string; message?: string }) {
  return (
    <Suspense fallback={null}>
      <SavedToastInner paramName={paramName} message={message} />
    </Suspense>
  );
}
