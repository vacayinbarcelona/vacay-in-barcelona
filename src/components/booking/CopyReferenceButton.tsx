'use client';

import { useState } from 'react';

// The whole "Reference" chip from the confirmation hero — label, value,
// copy icon, and a fading "Copied!" note — bundled together since they
// always appear as one unit.
export function CopyReferenceButton({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard access can fail (e.g. permissions) — fail silently, the
      // reference is already visible to copy manually.
    }
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 w-fit">
      <span className="text-[11px] text-gray-400">Reference</span>
      <span className="text-sm font-semibold">{reference}</span>
      <button type="button" onClick={handleCopy} aria-label="Copy reference" className="text-gray-400 hover:text-blue-600 ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" />
        </svg>
      </button>
      {copied ? <span className="text-[11px] text-green-600">Copied!</span> : null}
    </div>
  );
}
