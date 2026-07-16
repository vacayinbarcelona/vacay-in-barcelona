'use client';

import { useState } from 'react';
import { COUNTRY_CODES, isValidPhone, parsePhoneWithCountry } from '@/lib/countryCodes';

// Same email pattern used across the site's other forms (checkout, sign-up,
// supplier application) — required an @, a non-empty local/domain part, and
// an alphabetic TLD of 2+ letters.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

// The supplier email/phone fields inside ProductForm — split out as its own
// small client component (rather than making the whole ProductForm client-
// side) so it can carry live validation state and the same country-code
// phone selector used on the public supplier application form. `required`
// mirrors ProductForm's requireContactInfo — true on the supplier panel,
// optional for the Master Admin's own house products.
export function SupplierContactFields({
  defaultName,
  defaultEmail,
  defaultPhone,
  required,
  showName = true
}: {
  defaultName: string;
  defaultEmail: string;
  defaultPhone: string;
  required: boolean;
  // The supplier wizard no longer collects/edits this field on screen — its
  // previous value is carried forward untouched via a hidden input instead.
  // Master Admin's own product form still shows and edits it.
  showName?: boolean;
}) {
  const initialPhone = parsePhoneWithCountry(defaultPhone);

  const [name, setName] = useState(defaultName);
  const [nameTouched, setNameTouched] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(initialPhone.country);
  const [phoneNumber, setPhoneNumber] = useState(initialPhone.number);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const nameError = showName && !name.trim() && required ? 'Supplier name is required.' : null;

  const emailError = !email.trim()
    ? required
      ? 'Supplier email address is required.'
      : null
    : !EMAIL_PATTERN.test(email.trim())
      ? 'Please enter a valid email address.'
      : null;

  const phoneError = !phoneNumber.trim()
    ? required
      ? 'Supplier contact number is required.'
      : null
    : !isValidPhone(phoneNumber)
      ? 'Please enter a valid phone number.'
      : null;

  const countryCode = COUNTRY_CODES.find((c) => c.name === selectedCountry)?.code ?? '+34';
  const combinedPhone = phoneNumber.trim() ? `${countryCode} ${phoneNumber.trim()}` : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <input type="hidden" name="supplierContactPhone" value={combinedPhone} />

      {showName ? (
        <label className="block sm:col-span-2">
          <span className="text-xs font-medium text-gray-600 mb-1 block">Supplier name</span>
          <input
            name="supplierContactName"
            required={required}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setNameTouched(true)}
            placeholder="Who should the customer ask for?"
            className={`input ${nameTouched && nameError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {nameTouched && nameError ? <p className="text-[11px] text-red-600 mt-1">{nameError}</p> : null}
        </label>
      ) : (
        <input type="hidden" name="supplierContactName" value={defaultName} />
      )}

      <label className="block">
        <span className="text-xs font-medium text-gray-600 mb-1 block">Supplier email address</span>
        <input
          type="email"
          name="supplierContactEmail"
          required={required}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          className={`input ${emailTouched && emailError ? 'border-red-400 focus:border-red-400' : ''}`}
        />
        {emailTouched && emailError ? <p className="text-[11px] text-red-600 mt-1">{emailError}</p> : null}
      </label>

      <label className="block">
        <span className="text-xs font-medium text-gray-600 mb-1 block">Supplier contact number</span>
        <div className="flex gap-2">
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="input w-[168px] flex-shrink-0"
            aria-label="Country"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s()-]/g, ''))}
            onBlur={() => setPhoneTouched(true)}
            placeholder="123 456 789"
            className={`input flex-1 ${phoneTouched && phoneError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
        </div>
        {phoneTouched && phoneError ? <p className="text-[11px] text-red-600 mt-1">{phoneError}</p> : null}
      </label>
    </div>
  );
}
