import { headers } from 'next/headers';

// Best-effort, in-memory rate limiting — a second layer behind reCAPTCHA on
// spam-prone actions (checkout, contact form, resend-verification-email).
// Not a substitute for CAPTCHA: this Map lives in one serverless instance's
// memory, resets on cold start, and isn't shared across instances, so a
// determined attacker spreading requests across many instances can get
// around it. It still meaningfully slows down naive bots hammering a single
// warm instance, which is the common case. For airtight distributed rate
// limiting, a shared store (e.g. Upstash Redis) would be the next step.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Keep memory bounded — sweep expired entries once the map gets large,
// rather than letting it grow forever across a long-lived warm instance.
function sweepIfLarge() {
  if (buckets.size < 5000) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

/**
 * Returns true if `key` has exceeded `limit` calls within the trailing
 * `windowMs` window. Call once per attempt; each call counts toward the
 * limit whether or not the caller ends up rejecting the request.
 */
export function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  sweepIfLarge();
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
}

/** Best-effort client IP from standard proxy headers (Vercel sets these). */
export function getClientIp(): string {
  const h = headers();
  const forwardedFor = h.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return h.get('x-real-ip') ?? 'unknown';
}
