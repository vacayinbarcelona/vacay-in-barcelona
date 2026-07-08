import { cookies } from 'next/headers';
import crypto from 'crypto';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/db';

// Customer account sessions — separate from the admin session in
// src/lib/auth.ts (different cookie, different payload), but the same
// signed-cookie approach: no external auth library, a JSON payload
// base64url-encoded and HMAC-signed, joined to its signature by a single
// "." (splitting naively on "." broke once an email containing a dot was
// in the payload — see the fix in src/lib/auth.ts — so this format was
// designed to avoid that from the start).

const COOKIE_NAME = 'vib_customer_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours
const SCRYPT_KEYLEN = 64;

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

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;

  const derivedKey = await scryptAsync(password, salt);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedKey, storedBuf);
}

function createSessionToken(userId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ userId, expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token: string): { userId: string } | null {
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
    if (typeof parsed?.userId !== 'string' || typeof parsed?.expires !== 'number') return null;
    if (Date.now() > parsed.expires) return null;

    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

// Email confirmation for password sign-ups — Google sign-in doesn't need
// this (a Google account is already a verified email), only accounts
// created via /account/sign-up. Same signed-token approach as sessions,
// just a different purpose + TTL, and a distinct "purpose" field so a
// verification token can never be mistaken for/reused as a session token.
export function createEmailVerificationToken(userId: string): string {
  const expires = Date.now() + EMAIL_VERIFICATION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ userId, purpose: 'verify-email', expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifyEmailVerificationToken(token: string): { userId: string } | null {
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
    if (typeof parsed?.userId !== 'string' || typeof parsed?.expires !== 'number') return null;
    if (parsed.purpose !== 'verify-email') return null;
    if (Date.now() > parsed.expires) return null;

    return { userId: parsed.userId };
  } catch {
    return null;
  }
}

export async function setCustomerSessionCookie(userId: string) {
  const token = createSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCustomerSession(): Promise<{ userId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser(): Promise<User | null> {
  const session = await getCustomerSession();
  if (!session) return null;
  return prisma.user.findUnique({ where: { id: session.userId } });
}
