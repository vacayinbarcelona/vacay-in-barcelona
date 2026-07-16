import { cookies } from 'next/headers';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

// Supplier panel sessions — separate from both the admin session
// (src/lib/auth.ts) and the customer session (src/lib/customerAuth.ts):
// different cookie, different payload, and a supplier logging in never
// grants admin or customer access and vice versa. Same signed-cookie
// approach as the other two (no external auth library): a JSON payload,
// base64url-encoded, HMAC-signed, joined to its signature by a single "."
// (see src/lib/auth.ts's comment for why the payload is JSON rather than a
// naive "field.field.signature" join).

const COOKIE_NAME = 'vib_supplier_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const PASSWORD_SETUP_TTL_MS = 1000 * 60 * 60 * 48; // 48 hours — same window as customer email verification
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

export async function hashSupplierPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt);
  return `${salt}:${derivedKey.toString('hex')}`;
}

async function verifySupplierPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;

  const derivedKey = await scryptAsync(password, salt);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derivedKey, storedBuf);
}

export async function verifySupplierCredentials(email: string, password: string): Promise<{ id: string; companyName: string } | null> {
  const supplier = await prisma.supplier.findUnique({ where: { email } });
  if (!supplier || !supplier.passwordHash) return null;
  if (supplier.status !== 'approved') return null; // rejected/disabled/pending can't sign in
  if (!(await verifySupplierPassword(password, supplier.passwordHash))) return null;
  return { id: supplier.id, companyName: supplier.companyName };
}

function createSessionToken(supplierId: string): string {
  const expires = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ supplierId, expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

function verifySessionToken(token: string): { supplierId: string } | null {
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
    if (typeof parsed?.supplierId !== 'string' || typeof parsed?.expires !== 'number') return null;
    if (Date.now() > parsed.expires) return null;

    return { supplierId: parsed.supplierId };
  } catch {
    return null;
  }
}

// Sent as a link in the "Supplier Account Approved" email so the supplier
// sets their own password rather than being emailed one in plain text —
// same token shape/purpose-tagging approach as
// createEmailVerificationToken in src/lib/customerAuth.ts. Also reused for
// a future "forgot password" flow if one is added later.
export function createSupplierPasswordSetupToken(supplierId: string): string {
  const expires = Date.now() + PASSWORD_SETUP_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ supplierId, purpose: 'set-password', expires })).toString('base64url');
  const signature = sign(payloadB64);
  return `${payloadB64}.${signature}`;
}

export function verifySupplierPasswordSetupToken(token: string): { supplierId: string } | null {
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
    if (typeof parsed?.supplierId !== 'string' || typeof parsed?.expires !== 'number') return null;
    if (parsed.purpose !== 'set-password') return null;
    if (Date.now() > parsed.expires) return null;

    return { supplierId: parsed.supplierId };
  } catch {
    return null;
  }
}

export async function setSupplierSessionCookie(supplierId: string) {
  const token = createSessionToken(supplierId);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000
  });
}

export async function clearSupplierSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSupplierSession(): Promise<{ supplierId: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// Looks up the full Supplier row for the current session and confirms the
// account is still approved — a session cookie can outlive a disable/reject
// action taken after it was issued, so every protected supplier page should
// use this (not just getSupplierSession) before rendering anything.
export async function getCurrentSupplier() {
  const session = await getSupplierSession();
  if (!session) return null;
  const supplier = await prisma.supplier.findUnique({ where: { id: session.supplierId } });
  if (!supplier || supplier.status !== 'approved') return null;
  return supplier;
}
