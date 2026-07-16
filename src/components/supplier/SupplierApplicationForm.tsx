'use client';

import { useState } from 'react';
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget';

// Same validation conventions used across the site (checkout, sign-up):
// requires an @, a non-empty local/domain part, and an alphabetic TLD of
// 2+ letters — rejects plain text, symbols, and digit-only input that
// type="email" alone lets through in some browsers.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function isValidPhone(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[\d\s()-]+$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 15;
}

// Common country codes for a Barcelona-focused supplier marketplace — Spain
// first since that's the primary market, then other likely applicant
// countries. Not exhaustive, but covers the realistic range.
const COUNTRY_CODES = [
  { code: '+34', label: 'Spain (+34)' },
  { code: '+44', label: 'United Kingdom (+44)' },
  { code: '+1', label: 'United States / Canada (+1)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+39', label: 'Italy (+39)' },
  { code: '+351', label: 'Portugal (+351)' },
  { code: '+31', label: 'Netherlands (+31)' },
  { code: '+41', label: 'Switzerland (+41)' },
  { code: '+32', label: 'Belgium (+32)' },
  { code: '+353', label: 'Ireland (+353)' },
  { code: '+46', label: 'Sweden (+46)' },
  { code: '+45', label: 'Denmark (+45)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+91', label: 'India (+91)' },
  { code: '+55', label: 'Brazil (+55)' },
  { code: '+52', label: 'Mexico (+52)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+86', label: 'China (+86)' }
];

export function SupplierApplicationForm({
  action,
  categories,
  recaptchaSiteKey
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: { id: string; name: string; categoryLabel: string }[];
  recaptchaSiteKey?: string;
}) {
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+34');
  const [phone, setPhone] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [companyTouched, setCompanyTouched] = useState(false);
  const [contactTouched, setContactTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [categoriesTouched, setCategoriesTouched] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const companyError = !companyName.trim() ? 'Please enter your company name.' : null;
  const contactError = !contactName.trim() ? 'Please enter a contact name.' : null;
  const emailError = !email.trim()
    ? 'Please enter an email address.'
    : !EMAIL_PATTERN.test(email.trim())
      ? 'Please enter a valid email address.'
      : null;
  const phoneError = phone.trim() && !isValidPhone(phone) ? 'Please enter a valid phone number.' : null;

  function toggleCategory(id: string) {
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    setCompanyTouched(true);
    setContactTouched(true);
    setEmailTouched(true);
    setPhoneTouched(true);
    setCategoriesTouched(true);

    if (companyError || contactError || emailError || phoneError) {
      e.preventDefault();
      setClientError('Please fix the highlighted fields below.');
      return;
    }
    if (selectedCategories.length === 0) {
      e.preventDefault();
      setClientError('Please select at least one category.');
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">Company name</label>
          <input
            name="companyName"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            onBlur={() => setCompanyTouched(true)}
            className={`input ${companyTouched && companyError ? 'border-red-400 focus:border-red-400' : ''}`}
          />
          {companyTouched && companyError ? <p className="text-[11px] text-red-600 mt-1">{companyError}</p> : null}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Contact name</label>
          <input
            name="contactName"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
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
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="input w-[110px] flex-shrink-0"
              aria-label="Country code"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
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
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-gray-600 mb-1 block">
            Website / social profile <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input name="website" className="input" placeholder="https://" />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-2 block">Which categories would you like to sell in?</label>
        <div className="space-y-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-2.5 text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                name="categoryIds"
                value={c.id}
                checked={selectedCategories.includes(c.id)}
                onChange={() => toggleCategory(c.id)}
                className="h-4 w-4"
              />
              <span>
                {c.name}
                {c.categoryLabel ? <span className="text-gray-400"> — {c.categoryLabel}</span> : null}
              </span>
            </label>
          ))}
        </div>
        {categoriesTouched && selectedCategories.length === 0 ? (
          <p className="text-[11px] text-red-600 mt-1">Please select at least one category.</p>
        ) : null}
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">
          Tell us about your business <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          name="message"
          rows={4}
          className="input"
          placeholder="What tickets/tours do you offer, and what makes them worth listing?"
        />
      </div>

      {recaptchaSiteKey ? <RecaptchaWidget siteKey={recaptchaSiteKey} /> : null}

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
        Submit application
      </button>
    </form>
  );
}
