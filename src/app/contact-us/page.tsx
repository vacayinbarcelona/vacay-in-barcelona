import type { Metadata } from 'next';
import { sendContactMessage } from './actions';
import { getSeoMetadataFor } from '@/lib/siteSettings';

export async function generateMetadata(): Promise<Metadata> {
  const { title, description } = await getSeoMetadataFor('contact-us');
  return { title, description };
}

export default function ContactUsPage({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  const sent = searchParams?.sent === '1';
  const hasError = searchParams?.error === '1';

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <h1 className="text-2xl font-semibold mb-2">Contact us</h1>
      <p className="text-sm text-gray-500 mb-8">
        Questions about an existing booking, a general question about an attraction, or feedback on the site —
        we&apos;d like to hear it.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div className="sm:col-span-2">
          {sent ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-5 text-sm text-green-700">
              Thanks — your message has been sent. We&apos;ll get back to you by email as soon as we can.
            </div>
          ) : (
            <form action={sendContactMessage} className="space-y-4">
              {hasError ? (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  Please fill in your name, email, and message.
                </p>
              ) : null}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                <input name="name" required className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Email</label>
                <input type="email" name="email" required className="input" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Booking reference <span className="font-normal text-gray-400">(optional, if this is about an existing order)</span>
                </label>
                <input name="reference" className="input" placeholder="e.g. VIB-7K2P9Q" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Message</label>
                <textarea name="message" rows={5} required className="input" />
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-lg">
                Send message
              </button>
            </form>
          )}
        </div>

        <div className="text-sm text-gray-600 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Email</p>
            <p>support@vacayinbarcelona.com</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Response time</p>
            <p>We typically reply within 1–2 business days.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Booking help</p>
            <p>Include your order reference (e.g. VIB-7K2P9Q) for the fastest response.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
