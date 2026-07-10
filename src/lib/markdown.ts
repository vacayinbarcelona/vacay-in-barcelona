import { marked } from 'marked';

// Renders a blog post's Markdown content (see BlogPost.content in
// prisma/schema.prisma) to HTML for the article page, plus:
//   - injects an `id` on every H2/H3 so the table of contents can link to
//     them with plain #anchor hashes
//   - returns that same heading list as structured data for the TOC
//   - supports a small custom callout syntax on top of standard Markdown:
//       :::tip
//       Some helpful advice.
//       :::
//     renders as a styled "tip" box. Also supports :::info and :::warning.
// This content is admin-authored only (not public-submitted), so — same
// trust model as the rest of the admin panel — it isn't sanitized against
// XSS; don't reuse this renderer for anything user-submitted.

export type Heading = { id: string; text: string; level: 2 | 3 };

const CALLOUT_STYLES: Record<string, { label: string; classes: string }> = {
  tip: { label: 'Tip', classes: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  info: { label: 'Good to know', classes: 'border-blue-200 bg-blue-50 text-blue-900' },
  warning: { label: 'Heads up', classes: 'border-amber-200 bg-amber-50 text-amber-900' }
};

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Pulls out ":::type ... :::" blocks before handing the rest to marked, so
// they don't get mangled by the regular Markdown parser, then renders each
// block's inner content through marked too (so a tip can still contain
// **bold**, links, etc.) and splices the resulting HTML back in.
function renderCallouts(markdownSource: string): string {
  const calloutPattern = /:::(tip|info|warning)\s*\n([\s\S]*?)\n:::/g;

  return markdownSource.replace(calloutPattern, (_match, type: string, body: string) => {
    const style = CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info;
    const innerHtml = marked.parse(body.trim(), { async: false }) as string;
    return `<div class="not-prose my-6 rounded-2xl border ${style.classes} px-5 py-4">
      <p class="text-xs font-semibold uppercase tracking-wide mb-1.5">${style.label}</p>
      <div class="text-sm leading-relaxed [&_p]:m-0 [&_p+p]:mt-2">${innerHtml}</div>
    </div>`;
  });
}

export function renderMarkdown(markdownSource: string): { html: string; headings: Heading[] } {
  const withCallouts = renderCallouts(markdownSource);
  let html = marked.parse(withCallouts, { async: false }) as string;

  const headings: Heading[] = [];
  const usedIds = new Set<string>();

  html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_match, levelStr: string, inner: string) => {
    const level = Number(levelStr) as 2 | 3;
    const text = inner.replace(/<[^>]+>/g, '').trim();
    let id = slugifyHeading(text) || 'section';
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugifyHeading(text)}-${suffix}`;
      suffix++;
    }
    usedIds.add(id);
    headings.push({ id, text, level });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });

  return { html, headings };
}

// Word-count based estimate — good enough without pulling in a dedicated
// package. ~200 words/minute is the commonly used average adult reading
// speed for online article content.
export function estimateReadingMinutes(markdownSource: string): number {
  const plainText = markdownSource.replace(/:::(tip|info|warning)/g, '').replace(/[#*_>`[\]()!-]/g, ' ');
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200));
}

// Used as the card excerpt / meta description fallback when an admin
// leaves those fields blank.
export function excerptFromMarkdown(markdownSource: string, maxLength = 160): string {
  const withoutCallouts = markdownSource.replace(/:::(tip|info|warning)\s*\n[\s\S]*?\n:::/g, '');
  const plainText = withoutCallouts
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // links -> link text
    .replace(/[#>*_`~-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (plainText.length <= maxLength) return plainText;
  return `${plainText.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}
