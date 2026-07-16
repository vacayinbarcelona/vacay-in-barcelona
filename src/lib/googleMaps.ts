// Loads the Google Maps JavaScript API (Places library) exactly once,
// however many AddressAutocompleteInput instances end up on a page (e.g.
// the admin's inline ticket-option editor can render several ticket rows,
// each with its own meeting point address field). Every caller awaits the
// same cached promise instead of injecting the <script> tag more than once.
//
// No @types/google.maps dependency — the API surface used here (Autocomplete,
// place_changed, getPlace) is tiny, so callers just treat `window.google` as
// `any` rather than pulling in the full type package for one component.

let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsPlaces(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const w = window as unknown as { google?: { maps?: { places?: unknown } } };
  if (w.google?.maps?.places) return Promise.resolve();

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-places]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsPlaces = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
