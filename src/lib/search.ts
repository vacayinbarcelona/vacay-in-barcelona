// Lightweight, dependency-free fuzzy matching for site search (homepage
// hero typeahead + the /attractions?q= fallback listing). Good enough for a
// catalogue of a few dozen attractions — if the catalogue grows a lot,
// swap this for a real search index (e.g. Postgres full-text search or
// Algolia) instead of scaling this up further.
//
// Three things it does that a plain SQL `contains` can't:
//   1. Ignores accents/diacritics — "guell" matches "Güell".
//   2. Ignores punctuation and word order.
//   3. Tolerates small typos via edit distance — "sagrda" still finds
//      "Sagrada Família".

export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics: ü -> u, é -> e, etc.
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const currentRow = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow.push(Math.min(currentRow[j - 1] + 1, prevRow[j] + 1, prevRow[j - 1] + cost));
    }
    prevRow = currentRow;
  }

  return prevRow[b.length];
}

// Higher is a better match; 0 means "don't show this result at all".
export function matchScore(query: string, target: string): number {
  const q = normalize(query);
  const t = normalize(target);
  if (!q) return 0;

  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 80;

  const qTokens = q.split(' ').filter(Boolean);
  const tTokens = t.split(' ').filter(Boolean);
  if (qTokens.length === 0) return 0;

  let matchedTokens = 0;
  let typoTokens = 0;
  for (const qt of qTokens) {
    // Substring containment only counts between tokens of at least 3
    // characters each — otherwise a short target word like "la" or "de"
    // spuriously "matches" just because it happens to appear inside an
    // unrelated longer query word (e.g. "la" is a substring of
    // "flamenco"). Short tokens still match, just via exact equality.
    const exact = tTokens.some((tt) => {
      if (tt === qt) return true;
      if (tt.length >= 3 && qt.includes(tt)) return true;
      if (qt.length >= 3 && tt.includes(qt)) return true;
      return false;
    });
    if (exact) {
      matchedTokens++;
      continue;
    }
    // Allow small typos, scaled to word length so short words need an
    // almost-exact match while longer words tolerate a couple of slips.
    const maxDistance = qt.length <= 4 ? 1 : qt.length <= 7 ? 2 : 3;
    const closeEnough = tTokens.some((tt) => tt.length >= 3 && levenshtein(qt, tt) <= maxDistance);
    if (closeEnough) typoTokens++;
  }

  if (matchedTokens === qTokens.length) return 70;
  if (matchedTokens + typoTokens === qTokens.length) return 50;
  if (matchedTokens + typoTokens > 0) return Math.round(30 * ((matchedTokens + typoTokens) / qTokens.length));

  return 0;
}

export function fuzzySearch<T>(items: T[], query: string, getText: (item: T) => string, limit?: number): T[] {
  const ranked = items
    .map((item) => ({ item, score: matchScore(query, getText(item)) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);

  return limit ? ranked.slice(0, limit) : ranked;
}
