import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { buildGoogleAuthUrl } from '@/lib/googleAuth';

// Kicks off "Continue with Google": stashes a random nonce in an httpOnly
// cookie (checked again in the callback to block CSRF) and sends the
// browser to Google's consent screen. ?redirect=/checkout etc. travels
// through the OAuth "state" param (not sensitive, so no signing needed)
// and is validated as a same-site relative path on the way back.
export async function GET(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirect') || '/account';
  const safeRedirect = redirectTo.startsWith('/') ? redirectTo : '/account';

  const nonce = crypto.randomBytes(16).toString('hex');
  const state = Buffer.from(JSON.stringify({ nonce, redirectTo: safeRedirect })).toString('base64url');

  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set('vib_google_oauth_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10
  });
  return response;
}
