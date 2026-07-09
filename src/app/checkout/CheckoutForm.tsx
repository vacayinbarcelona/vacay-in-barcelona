'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/CartProvider';
import { formatDate, formatPrice } from '@/lib/format';
import { RecaptchaWidget, type RecaptchaWidgetHandle } from '@/components/auth/RecaptchaWidget';
import { createOrder, type CheckoutItemInput, type CheckoutTravelerInput } from './actions';

type TravelerNameDraft = { firstName: string; lastName: string };

type InitialUser = { id: string; firstName: string; lastName: string; email: string; phone: string } | null;

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function CheckoutForm({ initialUser }: { initialUser: InitialUser }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();
  const recaptchaRef = useRef<RecaptchaWidgetHandle>(null);

  // One traveler-name-fields list per cart item that requires them, keyed
  // by cart item id — sized to that item's adult+child count.
  const [travelerNamesByItem, setTravelerNamesByItem] = useState<Record<string, TravelerNameDraft[]>>({});

  useEffect(() => {
    setTravelerNamesByItem((prev) => {
      const next: Record<string, TravelerNameDraft[]> = {};
      for (const item of items) {
        if (!item.requiresAllTravelerNames) continue;
        const count = item.adults + item.children;
        const existing = prev[item.id];
        next[item.id] =
          existing && existing.length === count ? existing : Array.from({ length: count }, () => ({ firstName: '', lastName: '' }));
      }
      return next;
    });
  }, [items]);

  // Signed-in customers get their details prefilled (still editable) so
  // they don't have to retype them every time; guests start blank.
  const [leadFirstName, setLeadFirstName] = useState(initialUser?.firstName ?? '');
  const [leadLastName, setLeadLastName] = useState(initialUser?.lastName ?? '');
  const [email, setEmail] = useState(initialUser?.email ?? '');
  const [phone, setPhone] = useState(initialUser?.phone ?? '');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateTravelerName(itemId: string, index: number, field: keyof TravelerNameDraft, value: string) {
    setTravelerNamesByItem((prev) => ({
      ...prev,
      [itemId]: (prev[itemId] ?? []).map((t, i) => (i === index ? { ...t, [field]: value } : t))
    }));
  }

  async function handleSubmit() {
    setError(null);

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!leadFirstName.trim() || !leadLastName.trim()) {
      setError('Please enter the lead traveler’s first and last name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter an email address for your booking confirmation.');
      return;
    }
    if (!cardName || !cardNumber || !expiry || !cvc) {
      setError('Please fill in payment details.');
      return;
    }
    if (!initialUser && RECAPTCHA_SITE_KEY && !recaptchaRef.current?.getValue()) {
      setError('Please complete the captcha and try again.');
      return;
    }

    const checkoutItems: CheckoutItemInput[] = [];
    for (const item of items) {
      let travelers: CheckoutTravelerInput[] = [];
      if (item.requiresAllTravelerNames) {
        const names = travelerNamesByItem[item.id] ?? [];
        if (names.some((t) => !t.firstName.trim() || !t.lastName.trim())) {
          setError(`${item.attractionName} requires the first and last name of every traveler, as shown on ID.`);
          return;
        }
        travelers = names.map((t, i) => ({
          firstName: t.firstName.trim(),
          lastName: t.lastName.trim(),
          type: i < item.adults ? 'adult' : 'child'
        }));
      }

      checkoutItems.push({
        attractionSlug: item.attractionSlug,
        attractionName: item.attractionName,
        ticketOptionId: item.ticketOptionId,
        ticketOptionName: item.ticketOptionName,
        bookingDate: item.date,
        timeSlot: item.timeSlot,
        language: item.language,
        adults: item.adults,
        children: item.children,
        pricePerAdult: item.pricePerAdult,
        pricePerChild: item.pricePerChild,
        currency: item.currency,
        travelers
      });
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        items: checkoutItems,
        leadFirstName: leadFirstName.trim(),
        leadLastName: leadLastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        userId: initialUser?.id ?? null,
        captchaToken: recaptchaRef.current?.getValue() || null
      });

      if (result.success) {
        clear();
        router.push(`/booking-confirmation/${result.reference}`);
      } else {
        recaptchaRef.current?.reset();
        setError(result.error);
        setSubmitting(false);
      }
    } catch {
      recaptchaRef.current?.reset();
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Your cart is empty</h1>
        <p className="text-sm text-gray-500 mb-6">Add tickets or tours before checking out.</p>
        <Link href="/" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full inline-block">
          Browse attractions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link href="/cart" className="text-xs text-blue-600 font-medium">
        &larr; Back to cart
      </Link>
      <h1 className="text-xl font-semibold mt-3 mb-6">Checkout</h1>

      {initialUser ? (
        <p className="text-xs text-gray-500 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2 mb-6">
          Signed in as <span className="font-medium">{initialUser.email}</span> — this booking will be saved to your account.
        </p>
      ) : (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-6">
          Checking out as a guest.{' '}
          <Link href={`/account/sign-in?redirect=${encodeURIComponent('/checkout')}`} className="text-blue-600 font-medium hover:text-blue-700">
            Sign in
          </Link>{' '}
          to save this booking to an account.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {items.some((i) => i.requiresAllTravelerNames) ? (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold">Traveler names</h2>
              {items
                .filter((i) => i.requiresAllTravelerNames)
                .map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">{item.attractionName}</p>
                    <p className="text-[11px] text-gray-400 mb-3">
                      {item.ticketOptionName} — requires the first and last name of every traveler, exactly as shown on ID.
                    </p>
                    <div className="space-y-2">
                      {(travelerNamesByItem[item.id] ?? []).map((t, i) => (
                        <div key={i} className="grid grid-cols-2 gap-2">
                          <input
                            placeholder={`Traveler ${i + 1} first name`}
                            value={t.firstName}
                            onChange={(e) => updateTravelerName(item.id, i, 'firstName', e.target.value)}
                            className="input"
                          />
                          <input
                            placeholder={`Traveler ${i + 1} last name`}
                            value={t.lastName}
                            onChange={(e) => updateTravelerName(item.id, i, 'lastName', e.target.value)}
                            className="input"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          ) : null}

          <div>
            <h2 className="text-sm font-semibold mb-3">Lead traveler &amp; contact details</h2>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="First name" value={leadFirstName} onChange={(e) => setLeadFirstName(e.target.value)} className="input" />
                <input placeholder="Last name" value={leadLastName} onChange={(e) => setLeadLastName(e.target.value)} className="input" />
              </div>
              <input
                type="email"
                placeholder="Email — booking confirmation sent here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
              />
              <input type="tel" placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} className="input" />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold mb-3">Payment</h2>
            <div className="space-y-2">
              <input placeholder="Name on card" value={cardName} onChange={(e) => setCardName(e.target.value)} className="input" />
              <input placeholder="Card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="input" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="MM/YY" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="input" />
                <input placeholder="CVC" value={cvc} onChange={(e) => setCvc(e.target.value)} className="input" />
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Demo fields only — real payment will be handled by a secure, PCI-compliant provider (e.g. Stripe) before launch.
            </p>
          </div>

          {!initialUser && RECAPTCHA_SITE_KEY ? <RecaptchaWidget ref={recaptchaRef} siteKey={RECAPTCHA_SITE_KEY} /> : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-6 py-3 rounded-full"
          >
            {submitting ? 'Processing…' : `Confirm & pay ${formatPrice(subtotal, items[0]?.currency ?? 'EUR')}`}
          </button>
        </div>

        <div className="border border-gray-200 rounded-xl p-5 h-fit">
          <h2 className="text-sm font-semibold mb-4">Order summary</h2>
          <div className="space-y-4 mb-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                  <Image src={item.imageUrl} alt={item.imageAlt} fill className="object-cover" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{item.ticketOptionName}</p>
                  <p className="text-[11px] text-gray-400">
                    {formatDate(item.date)} · {item.timeSlot}
                  </p>
                  <p className="text-xs font-semibold mt-0.5">
                    {formatPrice(item.adults * item.pricePerAdult + item.children * item.pricePerChild, item.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">{formatPrice(subtotal, items[0]?.currency ?? 'EUR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
