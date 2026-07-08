import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

// Admin session handling — no external auth library required. A signed
// cookie (HMAC-SHA256) proves the visitor authenticated either as the
// single env-var "master" bootstrap account (ADMIN_EMAIL/ADMIN_PASSWORD —
// this one always works, so the panel can never be locked out) or as a
// database-backed AdminUser created from /admin/team (role "master" or
// "editor" — see ROLE PERMISSIONS below).
//
// Token format: "<base64url(JSON payload)>.<hex signature>". The payload is
// JSON so the email can safely contain dots (e.g. "name@domain.com") without
// being confused with the separator — an earlier version joined
// "email.expires.signature" with plain dots and broke for exactly that
// reason, since splitting on "." produced more than 3 parts.
//
// ROLE PERMISSIONS:
//   master — full access to everything in the admin panel.
//   editor — attractions content (/admin/attractions/**) and SEO
//            (/admin/seo) only. Dashboard, bookings, header/footer links,
//            and team management are master-only — see the role checks at
//            the top of each of those pages/actions.

export type AdminRole = 'master' | 'editor';

const COOKIE_NAME = 'vib_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
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

export function createSessionToken(email: string, role: AdminRole): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ email, role, expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token: string): { email: string; role: AdminRole } | null {
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
    if (parsed.role !== 'master' && parsed.role !== 'editor') return null;
    if (Date.now() > parsed.expires) return null;

    return { email: parsed.email, role: parsed.role };
  } catch {
    return null;
  }
}

// The single bootstrap account from .env — always "master", always
// available, so the panel can never be fully locked out.
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

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashAdminPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifyAdminPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;

  const derivedKey = await scryptAsync(password, salt);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedKey, storedBuf);
}

// Additional admin accounts created from /admin/team (master or editor).
export async function verifyAdminUserCredentials(email: string, password: string): Promise<{ email: string; role: AdminRole } | null> {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return null;
  if (!(await verifyAdminPassword(password, user.passwordHash))) return null;
  return { email: user.email, role: user.role === 'master' ? 'master' : 'editor' };
}

export async function setSessionCookie(email: string, role: AdminRole) {
  const token = createSessionToken(email, role);
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

export async function getSession(): Promise<{ email: string; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
