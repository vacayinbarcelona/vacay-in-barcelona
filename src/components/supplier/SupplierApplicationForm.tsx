'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget';
import { capitalizeWords } from '@/lib/format';
import { COUNTRY_CODES, isValidPhone } from '@/lib/countryCodes';

// Same validation conventions used across the site (checkout, sign-up):
// requires an @, a non-empty local/domain part, and an alphabetic TLD of
// 2+ letters — rejects plain text, symbols, and digit-only input that
// type="email" alone lets through in some browsers.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

export function SupplierApplicationForm({
  action,
  recaptchaSiteKey
}: {
  action: (formData: FormData) => void | Promise<void>;
  recaptchaSiteKey?: string;
}) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  // Keyed by country *name*, not dial code — several countries share the
  // same code (e.g. +1 covers the US, Canada, Bahamas, Jamaica...), so a
  // <select> bound to the code alone always resolves to whichever of those
  // options comes first in the list, snapping the visible selection back to
  // it regardless of which one was actually picked.
  const [selectedCountry, setSelectedCountry] = useState('Spain');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [registeredCountry, setRegisteredCountry] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [companyTouched, setCompanyTouched] = useState(false);
  const [contactTouched, setContactTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [taxIdTouched, setTaxIdTouched] = useState(false);
  const [registeredCountryTouched, setRegisteredCountryTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const companyError = !companyName.trim() ? 'Please enter your company name.' : null;
  const contactError = !contactName.trim() ? 'Please enter a contact name.' : null;
  const emailError = !email.trim()
    ? 'Please enter an email address.'
    : !EMAIL_PATTERN.test(email.trim())
      ? 'Please enter a valid email address.'
      : null;
  const phoneError = phone.trim() && !isValidPhone(phone) ? 'Please enter a valid phone number.' : null;
  const taxIdError = !taxId.trim() ? 'Please enter your company tax ID / registration number.' : null;
  const registeredCountryError = !registeredCountry ? 'Please select where your company is registered.' : null;
  const countryCode = COUNTRY_CODES.find((c) => c.name === selectedCountry)?.code ?? '+34';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setCompanyTouched(true);
    setContactTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setTaxIdTouched(true);
    setRegisteredCountryTouched(true);
    setTermsTouched(true);

    if (companyError || contactError || emailError || phoneError || taxIdError || registeredCountryError) {
      e.preventDefault();
      setClientError('Please fix the highlighted fields below.');
      return;
    }
    if (!termsAccepted) {
      e.preventDefault();
      setClientError('Please confirm you have read the supplier terms & conditions and privacy policy.');
      return;
    }
    setClientError(null);
  }

  const combinedPhone = phone.trim() ? `${countryCode} ${phone.trim()}` : '';

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-5">
      {clientError ? <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{clientError}</p> : null}

      {/* Honeypot — hidden from real visitors, but simple bots that
          auto-fill every field will fill this in too. */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <input type="hidden" name="phone" value={combinedPhone} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Company Name</label>
          <input
            name="companyName"
            required
            value={companyName}
            onChange={(e) => setCompanyName(capitalizeWords(e.target.value))}
            onBlur={() => setCompanyTouched(true)}
            className={`input ${companyTouched && companyError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {companyTouched && companyError ? <p className="text-[11px] text-red-600 mt-1">{companyError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Contact Name</label>
          <input
            name="contactName"
            required
            value={contactName}
            onChange={(e) => setContactName(capitalizeWords(e.target.value))}
            onBlur={() => setContactTouched(true)}
            className={`input ${contactTouched && contactError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {contactTouched && contactError ? <p className="text-[11px] text-red-600 mt-1">{contactError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={`input ${emailTouched && emailError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {emailTouched && emailError ? <p className="text-[11px] text-red-600 mt-1">{emailError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Phone</label>
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
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d\s()-]/g, ''))}
              onBlur={() => setPhoneTouched(true)}
              placeholder="123 456 789"
              className={`input flex-1 ${phoneTouched && phoneError ? 'border-red-400 focus:border-red-400' : ''}`}
            />
          </div>
          {phoneTouched && phoneError ? <p className="text-[11px] text-red-600 mt-1">{phoneError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Company Tax ID / Registration No.</label>
          <input
            name="taxId"
            required
            value={taxId}
            onChange={(e) => setTaxId(e.target.value)}
            onBlur={() => setTaxIdTouched(true)}
            className={`input ${taxIdTouched && taxIdError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {taxIdTouched && taxIdError ? <p className="text-[11px] text-red-600 mt-1">{taxIdError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Country where company is registered</label>
          <select
            name="registeredCountry"
            required
            value={registeredCountry}
            onChange={(e) => setRegisteredCountry(e.target.value)}
            onBlur={() => setRegisteredCountryTouched(true)}
            className={`input ${registeredCountryTouched && registeredCountryError ? 'border-red-400 focus:border-red-400' : ''}`}
          >
            <option value="" disabled>
              Select a country&hellip;
            </option>
            {COUNTRY_CODES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          {registeredCountryTouched && registeredCountryError ? (
            <p className="text-[11px] text-red-600 mt-1">{registeredCountryError}</p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Website / Social Profile <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input name="website" className="input" placeholder="https://" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Tell us about your business <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          className="input"
          placeholder="What tickets/tours do you offer, and which categories would you like to sell in?"
        />
      </div>

      <div>
        <label className="flex items-start gap-2.5 text-sm text-gray-700">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            onBlur={() => setTermsTouched(true)}
            className="h-4 w-4 mt-0.5"
          />
          <span>
            I have read the{' '}
            <Link href="/terms-conditions" target="_blank" className="text-blue-600 font-medium">
              supplier terms &amp; conditions
            </Link>{' '}
            and{' '}
            <Link href="/privacy-policy" target="_blank" className="text-blue-600 font-medium">
              privacy policy
            </Link>
            .
          </span>
        </label>
        {termsTouched && !termsAccepted ? (
          <p className="text-[11px] text-red-600 mt-1">Please confirm you have read the supplier terms & conditions and privacy policy.</p>
        ) : null}
      </div>

      {recaptchaSiteKey ? <RecaptchaWidget siteKey={recaptchaSiteKey} /> : null}

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
        Submit application
      </button>
    </form>
  );
}
