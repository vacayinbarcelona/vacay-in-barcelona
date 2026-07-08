import { cookies } from 'next/headers';
import crypto from 'crypto';

// Lightweight admin session handling — no external auth library required.
// A signed cookie (HMAC-SHA256) proves the visitor authenticated against
// ADMIN_EMAIL / ADMIN_PASSWORD in .env. This is intentionally simple for a
// single-operator admin panel; if you add more admin users later, swap this
// for NextAuth or a real users table.
//
// Token format: "<base64url(JSON payload)>.<hex signature>". The payload is
// JSON so the email can safely contain dots (e.g. "name@domain.com") without
// being confused with the separator — an earlier version joined
// "email.expires.signature" with plain dots and broke for exactly that
// reason, since splitting on "." produced more than 3 parts.

const COOKIE_NAME = 'vib_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is not set. Add it to your .env file (see .env.example).');
  }
  return secret;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function createSessionToken(email: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ email, expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token: string): { email: string } | null {
  try {
    const separatorIndex = token.lastIndexOf('.');
    if (separatorIndex === -1) return null;

    const payloadB64 = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    const expected = sign(payloadB64);

    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (typeof parsed?.email !== 'string' || typeof parsed?.expires !== 'number') return null;
    if (Date.now() > parsed.expires) return null;

    return { email: parsed.email };
  } catch {
    return null;
  }
}

export function verifyCredentials(email: string, password: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL ?? '';
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';
  if (!adminEmail || !adminPassword) return false;

  const emailBuf = Buffer.from(email);
  const adminEmailBuf = Buffer.from(adminEmail);
  const emailMatches =
    emailBuf.length === adminEmailBuf.length && crypto.timingSafeEqual(emailBuf, adminEmailBuf);

  const passBuf = Buffer.from(password);
  const adminPassBuf = Buffer.from(adminPassword);
  const passMatches =
    passBuf.length === adminPassBuf.length && crypto.timingSafeEqual(passBuf, adminPassBuf);

  return emailMatches && passMatches;
}

export async function setSessionCookie(email: string) {
  const token = createSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
