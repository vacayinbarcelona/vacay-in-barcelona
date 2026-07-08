import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { exchangeCodeForTokens, fetchGoogleUserInfo } from '@/lib/googleAuth';
import { setCustomerSessionCookie } from '@/lib/customerAuth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const stateRaw = request.nextUrl.searchParams.get('state');
  const errorParam = request.nextUrl.searchParams.get('error');

  const cookieStore = await cookies();
  const expectedNonce = cookieStore.get('vib_google_oauth_nonce')?.value;
  cookieStore.delete('vib_google_oauth_nonce');

  if (errorParam || !code || !stateRaw) {
    return NextResponse.redirect(new URL('/account/sign-in?error=google', request.url));
  }

  let redirectTo = '/account';
  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    if (!expectedNonce || state.nonce !== expectedNonce) {
      return NextResponse.redirect(new URL('/account/sign-in?error=google', request.url));
    }
    if (typeof state.redirectTo === 'string' && state.redirectTo.startsWith('/')) {
      redirectTo = state.redirectTo;
    }
  } catch {
    return NextResponse.redirect(new URL('/account/sign-in?error=google', request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email) {
      return NextResponse.redirect(new URL('/account/sign-in?error=google', request.url));
    }

    const email = profile.email.toLowerCase();

    // Match an existing account by Google id first, then by email — the
    // second case links a Google sign-in to an account that was originally
    // created with a password, so the customer doesn't end up with two
    // separate accounts for the same email address.
    let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      user = existingByEmail
        ? await prisma.user.update({ where: { id: existingByEmail.id }, data: { googleId: profile.sub } })
        : await prisma.user.create({
            data: {
              email,
              googleId: profile.sub,
              firstName: profile.given_name || profile.name?.split(' ')[0] || 'Guest',
              lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || ''
            }
          });
    }

    await setCustomerSessionCookie(user.id);
    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    console.error('Google sign-in failed:', err);
    return NextResponse.redirect(new URL('/account/sign-in?error=google', request.url));
  }
}
