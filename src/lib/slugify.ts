const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '') // strip accents (Família -> Familia)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
