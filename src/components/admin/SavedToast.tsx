'use client';

import { useEffect, useState } from 'react';

// A floating confirmation toast instead of an inline banner at the top of
// the page. The inline version had a real problem: on long admin pages
// (e.g. the attraction edit page, where "Save" on the Tickets section is
// often 1000+px down), the "Saved." message rendered above everything and
// was invisible unless you scrolled back to the top. This renders fixed to
// the viewport instead — visible wherever you're scrolled — and clears
// itself after 3 seconds so it doesn't linger.
export function SavedToast({ show, message = 'Saved.' }: { show: boolean; message?: string }) {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(show);
    if (!show) return;
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
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
