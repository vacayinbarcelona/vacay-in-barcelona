'use server';

import { redirect } from 'next/navigation';
import { Resend } from 'resend';

// Sends contact form submissions to the site inbox via Resend. If
// RESEND_API_KEY / EMAIL_FROM aren't set yet (see .env.example), the
// message is logged instead of thrown away, so local dev doesn't need a
// real email provider configured just to test the form.
export async function sendContactMessage(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!name || !email || !message) {
    redirect('/contact-us?error=1');
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from && !apiKey.startsWith('re_xxxx')) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: from,
        replyTo: email,
        subject: `Contact form: ${name}`,
        html: `<p><strong>From:</strong> ${escapeHtml(name)} (${escapeHtml(email)})</p><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`
      });
    } catch (err) {
      console.error('Contact form email failed to send:', err);
    }
  } else {
    console.log('[contact form — email not configured, logging instead]', { name, email, message });
  }

  redirect('/contact-us?sent=1');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
