import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyEmailVerificationToken, setCustomerSessionCookie } from '@/lib/customerAuth';

// Landed on from the link in the confirmation email (see sendVerificationEmail
// in src/lib/email.ts). Marks the account verified and signs them straight
// in — they've just proven they own the inbox, no need to make them type
// their password again right after.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const redirectTo = request.nextUrl.searchParams.get('redirect');
  const safeRedirect = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/account';

  if (!token) {
    return NextResponse.redirect(new URL('/account/sign-in?error=invalid-link', request.url));
  }

  const result = verifyEmailVerificationToken(token);
  if (!result) {
    return NextResponse.redirect(new URL('/account/sign-in?error=invalid-link', request.url));
  }

  const user = await prisma.user.findUnique({ where: { id: result.userId } });
  if (!user) {
    return NextResponse.redirect(new URL('/account/sign-in?error=invalid-link', request.url));
  }

  if (!user.emailVerified) {
    await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } });
  }

  await setCustomerSessionCookie(user.id);

  const destination = new URL(safeRedirect, request.url);
  destination.searchParams.set('verified', '1');
  return NextResponse.redirect(destination);
}
