/**
 * High-performance sliding-window in-memory rate limiter for Next.js.
 * Protects auth endpoints, AI generation, file uploads, billing, and contact forms
 * from brute-force attacks, credential stuffing, and denial-of-service attempts.
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Automatic cleanup every 5 minutes to prevent memory accumulation
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeExpiredEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRefill > windowMs * 2) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetSeconds: number;
}

/**
 * Checks whether an action by a client key (e.g. IP address) exceeds the rate limit.
 * Uses a token bucket algorithm with smooth refilling.
 *
 * @param key Identifier for the rate limit bucket (e.g. `auth:192.168.1.1`)
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Time window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  purgeExpiredEntries(windowMs);

  let entry = rateLimitStore.get(key);

  if (!entry) {
    entry = { tokens: limit - 1, lastRefill: now };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: limit - 1,
      limit,
      resetSeconds: windowSeconds,
    };
  }

  // Refill tokens based on elapsed time
  const elapsed = now - entry.lastRefill;
  const tokensToAdd = (elapsed / windowMs) * limit;
  entry.tokens = Math.min(limit, entry.tokens + tokensToAdd);
  entry.lastRefill = now;

  if (entry.tokens >= 1) {
    entry.tokens -= 1;
    const resetSeconds = Math.ceil(((limit - entry.tokens) / limit) * windowSeconds);
    return {
      allowed: true,
      remaining: Math.floor(entry.tokens),
      limit,
      resetSeconds: Math.max(1, resetSeconds),
    };
  }

  // Rate limit exceeded
  const retryAfter = Math.ceil(((1 - entry.tokens) / limit) * windowSeconds);
  return {
    allowed: false,
    remaining: 0,
    limit,
    resetSeconds: Math.max(1, retryAfter),
  };
}

/**
 * Extracts the best reliable client IP address from request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp?.trim()) return cfIp.trim();

  return "127.0.0.1";
}
