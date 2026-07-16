'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMapsPlaces } from '@/lib/googleMaps';

// Biases (doesn't hard-restrict) suggestions toward Barcelona, since that's
// where every current supplier operates — a rough bounding box around the
// city. A supplier could still type/select an address outside it if needed.
const BARCELONA_BOUNDS = { north: 41.47, south: 41.32, east: 2.23, west: 2.05 };

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Google's own `formatted_address` for a landmark/POI (e.g. Sagrada Família)
// includes the neighborhood/district level — "Sagrada Família, Eixample,
// Barcelona, Spain" — which is more detail than a customer needs and reads
// oddly as a "meeting point address". This rebuilds a cleaner string from
// the place's individual address_components instead, deliberately skipping
// sublocality/neighborhood, keeping just a name-or-street-address + city +
// country.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildCleanAddress(place: any): string {
  const components: { long_name: string; types: string[] }[] = place?.address_components ?? [];
  const find = (type: string) => components.find((c) => c.types.includes(type))?.long_name;

  const city = find('locality') || find('postal_town') || find('administrative_area_level_2');
  const country = find('country');
  const streetNumber = find('street_number');
  const route = find('route');
  const streetAddress = [route, streetNumber].filter(Boolean).join(' ');

  // Prefer the place's own name (e.g. "Sagrada Família") when it's a named
  // place rather than a bare street address; otherwise fall back to the
  // street address, then to Google's full formatted_address as a last resort.
  const primary = (place?.name && place.name !== streetAddress ? place.name : streetAddress) || place?.formatted_address;

  return [primary, city, country].filter(Boolean).join(', ');
}

// Google Places Autocomplete attached to a plain text input — used for the
// "Meeting Point Address" field so typing e.g. "park guell" offers the real
// place, and picking it fills in the full formatted address that then feeds
// the Google Maps link on the booking confirmation page/email (see
// meetingPointAddress in booking-confirmation and src/lib/email.ts).
//
// Degrades to a normal text input with no suggestions if
// NEXT_PUBLIC_GOOGLE_MAPS_API_KEY isn't set — nothing breaks, it just won't
// autocomplete. See .env.example for how to add the key.
export function AddressAutocompleteInput({
  name,
  defaultValue = '',
  placeholder,
  className = 'input'
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!API_KEY || !inputRef.current) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let autocomplete: any;

    loadGoogleMapsPlaces(API_KEY)
      .then(() => {
        if (cancelled || !inputRef.current) return;
        const w = window as unknown as { google?: any };
        if (!w.google?.maps?.places) return;

        autocomplete = new w.google.maps.places.Autocomplete(inputRef.current, {
          fields: ['formatted_address', 'name', 'address_components'],
          bounds: BARCELONA_BOUNDS
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const value = buildCleanAddress(place);
          if (value && inputRef.current) {
            inputRef.current.value = value;
          }
        });
      })
      .catch(() => {
        // Silent — the field just stays a plain text input if the script
        // fails to load (e.g. bad/missing key, offline, ad blocker).
      });

    return () => {
      cancelled = true;
      const w = window as unknown as { google?: any };
      if (autocomplete && w.google?.maps?.event) {
        w.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      autoComplete="off"
    />
  );
}
