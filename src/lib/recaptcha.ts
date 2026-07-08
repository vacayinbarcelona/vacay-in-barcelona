// Server-side verification for Google reCAPTCHA v2 (checkbox) — protects
// email/password sign-up and sign-in from bots and scripted spam. Requires
// NEXT_PUBLIC_RECAPTCHA_SITE_KEY (used by the widget script in the page)
// and RECAPTCHA_SECRET_KEY (used only here, server-side) — get both from
// https://www.google.com/recaptcha/admin. "Continue with Google" doesn't
// use this — signing in with a real Google account is already a strong
// bot deterrent on its own.

export async function verifyRecaptcha(token: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Keys not set up yet — don't block sign-up/sign-in over a missing
    // config value during local development. Once RECAPTCHA_SECRET_KEY is
    // set, verification is enforced for real.
    console.warn('RECAPTCHA_SECRET_KEY is not set — skipping captcha verification.');
    return true;
  }

  if (!token) return false;

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token })
    });
    const data = await response.json();
    return data.success === true;
  } catch (err) {
    console.error('reCAPTCHA verification request failed:', err);
    return false;
  }
}
