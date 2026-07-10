'use client';

import { useState } from 'react';
import { IconLink } from '@/components/ui/Icons';

// Facebook/X/WhatsApp just need a plain share-intent URL — no SDK or client
// JS required for those. Only "Copy link" needs to be a client component,
// for clipboard access.
export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, insecure context) — no harm
      // done, the user can still select the URL from their address bar.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="h-9 w-9 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-sm font-bold hover:opacity-90"
      >
        f
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
        className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold hover:opacity-90"
      >
        𝕏
      </a>
      <a
        href={`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on WhatsApp"
        className="h-9 w-9 rounded-full bg-[#25D366] text-white flex items-center justify-center text-sm font-bold hover:opacity-90"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 5l-1.4 5.11 5.23-1.37a9.9 9.9 0 004.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2zm5.8 14.15c-.24.68-1.4 1.3-1.94 1.38-.5.08-1.13.11-1.82-.12-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.8-4.17-4.94-4.36-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.02-2.41.27-.29.58-.36.78-.36.19 0 .39 0 .55.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.11.32.02.51-.09.19-.14.31-.28.48-.14.16-.29.36-.42.48-.14.13-.28.28-.12.55.16.28.72 1.19 1.55 1.93 1.06.95 1.96 1.24 2.24 1.38.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.86.26.13.43.19.5.3.06.11.06.63-.18 1.31z" />
        </svg>
      </a>
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="h-9 w-9 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:bg-gray-50 relative"
      >
        <IconLink className="h-4 w-4" />
        {copied ? (
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[11px] px-2 py-1 rounded-md whitespace-nowrap">
            Copied!
          </span>
        ) : null}
      </button>
    </div>
  );
}
