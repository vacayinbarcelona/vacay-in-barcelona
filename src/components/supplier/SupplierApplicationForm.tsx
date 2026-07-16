'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RecaptchaWidget } from '@/components/auth/RecaptchaWidget';
import { capitalizeWords } from '@/lib/format';

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

// Every country's calling code, short name — not just a handful of likely
// applicant countries. Sorted alphabetically by short name so it's easy to
// scan/type-to-find in the <select>; the default selected value (Spain) is
// set via useState below, not by list order.
const COUNTRY_CODES = [
  { code: '+93', name: 'Afghanistan' },
  { code: '+355', name: 'Albania' },
  { code: '+213', name: 'Algeria' },
  { code: '+376', name: 'Andorra' },
  { code: '+244', name: 'Angola' },
  { code: '+54', name: 'Argentina' },
  { code: '+374', name: 'Armenia' },
  { code: '+61', name: 'Australia' },
  { code: '+43', name: 'Austria' },
  { code: '+994', name: 'Azerbaijan' },
  { code: '+1', name: 'Bahamas' },
  { code: '+973', name: 'Bahrain' },
  { code: '+880', name: 'Bangladesh' },
  { code: '+1', name: 'Barbados' },
  { code: '+375', name: 'Belarus' },
  { code: '+32', name: 'Belgium' },
  { code: '+501', name: 'Belize' },
  { code: '+229', name: 'Benin' },
  { code: '+975', name: 'Bhutan' },
  { code: '+591', name: 'Bolivia' },
  { code: '+387', name: 'Bosnia and Herzegovina' },
  { code: '+267', name: 'Botswana' },
  { code: '+55', name: 'Brazil' },
  { code: '+673', name: 'Brunei' },
  { code: '+359', name: 'Bulgaria' },
  { code: '+226', name: 'Burkina Faso' },
  { code: '+257', name: 'Burundi' },
  { code: '+855', name: 'Cambodia' },
  { code: '+237', name: 'Cameroon' },
  { code: '+1', name: 'Canada' },
  { code: '+238', name: 'Cape Verde' },
  { code: '+236', name: 'Central African Republic' },
  { code: '+235', name: 'Chad' },
  { code: '+56', name: 'Chile' },
  { code: '+86', name: 'China' },
  { code: '+57', name: 'Colombia' },
  { code: '+269', name: 'Comoros' },
  { code: '+506', name: 'Costa Rica' },
  { code: '+385', name: 'Croatia' },
  { code: '+53', name: 'Cuba' },
  { code: '+357', name: 'Cyprus' },
  { code: '+420', name: 'Czech Republic' },
  { code: '+243', name: 'DR Congo' },
  { code: '+45', name: 'Denmark' },
  { code: '+253', name: 'Djibouti' },
  { code: '+1', name: 'Dominica' },
  { code: '+1', name: 'Dominican Republic' },
  { code: '+670', name: 'East Timor' },
  { code: '+593', name: 'Ecuador' },
  { code: '+20', name: 'Egypt' },
  { code: '+503', name: 'El Salvador' },
  { code: '+240', name: 'Equatorial Guinea' },
  { code: '+291', name: 'Eritrea' },
  { code: '+372', name: 'Estonia' },
  { code: '+268', name: 'Eswatini' },
  { code: '+251', name: 'Ethiopia' },
  { code: '+679', name: 'Fiji' },
  { code: '+358', name: 'Finland' },
  { code: '+33', name: 'France' },
  { code: '+241', name: 'Gabon' },
  { code: '+220', name: 'Gambia' },
  { code: '+995', name: 'Georgia' },
  { code: '+49', name: 'Germany' },
  { code: '+233', name: 'Ghana' },
  { code: '+30', name: 'Greece' },
  { code: '+1', name: 'Grenada' },
  { code: '+502', name: 'Guatemala' },
  { code: '+224', name: 'Guinea' },
  { code: '+245', name: 'Guinea-Bissau' },
  { code: '+592', name: 'Guyana' },
  { code: '+509', name: 'Haiti' },
  { code: '+504', name: 'Honduras' },
  { code: '+36', name: 'Hungary' },
  { code: '+354', name: 'Iceland' },
  { code: '+91', name: 'India' },
  { code: '+62', name: 'Indonesia' },
  { code: '+98', name: 'Iran' },
  { code: '+964', name: 'Iraq' },
  { code: '+353', name: 'Ireland' },
  { code: '+972', name: 'Israel' },
  { code: '+39', name: 'Italy' },
  { code: '+225', name: 'Ivory Coast' },
  { code: '+1', name: 'Jamaica' },
  { code: '+81', name: 'Japan' },
  { code: '+962', name: 'Jordan' },
  { code: '+7', name: 'Kazakhstan' },
  { code: '+254', name: 'Kenya' },
  { code: '+686', name: 'Kiribati' },
  { code: '+383', name: 'Kosovo' },
  { code: '+965', name: 'Kuwait' },
  { code: '+996', name: 'Kyrgyzstan' },
  { code: '+856', name: 'Laos' },
  { code: '+371', name: 'Latvia' },
  { code: '+961', name: 'Lebanon' },
  { code: '+266', name: 'Lesotho' },
  { code: '+231', name: 'Liberia' },
  { code: '+218', name: 'Libya' },
  { code: '+423', name: 'Liechtenstein' },
  { code: '+370', name: 'Lithuania' },
  { code: '+352', name: 'Luxembourg' },
  { code: '+261', name: 'Madagascar' },
  { code: '+265', name: 'Malawi' },
  { code: '+60', name: 'Malaysia' },
  { code: '+960', name: 'Maldives' },
  { code: '+223', name: 'Mali' },
  { code: '+356', name: 'Malta' },
  { code: '+692', name: 'Marshall Islands' },
  { code: '+222', name: 'Mauritania' },
  { code: '+230', name: 'Mauritius' },
  { code: '+52', name: 'Mexico' },
  { code: '+691', name: 'Micronesia' },
  { code: '+373', name: 'Moldova' },
  { code: '+377', name: 'Monaco' },
  { code: '+976', name: 'Mongolia' },
  { code: '+382', name: 'Montenegro' },
  { code: '+212', name: 'Morocco' },
  { code: '+258', name: 'Mozambique' },
  { code: '+95', name: 'Myanmar' },
  { code: '+264', name: 'Namibia' },
  { code: '+674', name: 'Nauru' },
  { code: '+977', name: 'Nepal' },
  { code: '+31', name: 'Netherlands' },
  { code: '+64', name: 'New Zealand' },
  { code: '+505', name: 'Nicaragua' },
  { code: '+227', name: 'Niger' },
  { code: '+234', name: 'Nigeria' },
  { code: '+850', name: 'North Korea' },
  { code: '+389', name: 'North Macedonia' },
  { code: '+47', name: 'Norway' },
  { code: '+968', name: 'Oman' },
  { code: '+92', name: 'Pakistan' },
  { code: '+680', name: 'Palau' },
  { code: '+970', name: 'Palestine' },
  { code: '+507', name: 'Panama' },
  { code: '+675', name: 'Papua New Guinea' },
  { code: '+595', name: 'Paraguay' },
  { code: '+51', name: 'Peru' },
  { code: '+63', name: 'Philippines' },
  { code: '+48', name: 'Poland' },
  { code: '+351', name: 'Portugal' },
  { code: '+974', name: 'Qatar' },
  { code: '+242', name: 'Republic of the Congo' },
  { code: '+40', name: 'Romania' },
  { code: '+7', name: 'Russia' },
  { code: '+250', name: 'Rwanda' },
  { code: '+1', name: 'Saint Kitts and Nevis' },
  { code: '+1', name: 'Saint Lucia' },
  { code: '+1', name: 'Saint Vincent and the Grenadines' },
  { code: '+685', name: 'Samoa' },
  { code: '+378', name: 'San Marino' },
  { code: '+239', name: 'Sao Tome and Principe' },
  { code: '+966', name: 'Saudi Arabia' },
  { code: '+221', name: 'Senegal' },
  { code: '+381', name: 'Serbia' },
  { code: '+248', name: 'Seychelles' },
  { code: '+232', name: 'Sierra Leone' },
  { code: '+65', name: 'Singapore' },
  { code: '+421', name: 'Slovakia' },
  { code: '+386', name: 'Slovenia' },
  { code: '+677', name: 'Solomon Islands' },
  { code: '+252', name: 'Somalia' },
  { code: '+27', name: 'South Africa' },
  { code: '+82', name: 'South Korea' },
  { code: '+211', name: 'South Sudan' },
  { code: '+34', name: 'Spain' },
  { code: '+94', name: 'Sri Lanka' },
  { code: '+249', name: 'Sudan' },
  { code: '+597', name: 'Suriname' },
  { code: '+46', name: 'Sweden' },
  { code: '+41', name: 'Switzerland' },
  { code: '+963', name: 'Syria' },
  { code: '+886', name: 'Taiwan' },
  { code: '+992', name: 'Tajikistan' },
  { code: '+255', name: 'Tanzania' },
  { code: '+66', name: 'Thailand' },
  { code: '+228', name: 'Togo' },
  { code: '+676', name: 'Tonga' },
  { code: '+1', name: 'Trinidad and Tobago' },
  { code: '+216', name: 'Tunisia' },
  { code: '+90', name: 'Turkey' },
  { code: '+993', name: 'Turkmenistan' },
  { code: '+688', name: 'Tuvalu' },
  { code: '+256', name: 'Uganda' },
  { code: '+380', name: 'Ukraine' },
  { code: '+971', name: 'United Arab Emirates' },
  { code: '+44', name: 'United Kingdom' },
  { code: '+1', name: 'United States' },
  { code: '+598', name: 'Uruguay' },
  { code: '+998', name: 'Uzbekistan' },
  { code: '+678', name: 'Vanuatu' },
  { code: '+379', name: 'Vatican City' },
  { code: '+58', name: 'Venezuela' },
  { code: '+84', name: 'Vietnam' },
  { code: '+967', name: 'Yemen' },
  { code: '+260', name: 'Zambia' },
  { code: '+263', name: 'Zimbabwe' }
];

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
          <label className="text-xs font-medium text-gray-600 mb-1 block">Company name</label>
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">Contact name</label>
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">Company tax ID / registration no.</label>
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
            Website / social profile <span className="font-normal text-gray-400">(optional)</span>
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
