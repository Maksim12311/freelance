/**
 * Simple in-memory rate limiter for sensitive actions (signup, login,
 * verification upload, report).
 *
 * LIMITATION: This store is process-local. On multi-instance / serverless
 * deployments each instance keeps its own Map, so limits are not shared and
 * can be bypassed by hitting different instances. Replace with Redis / Upstash
 * (or similar) before production scale-out.
 */

export type RateLimitAction =
  | "signup"
  | "login"
  | "verification_upload"
  | "report";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const DEFAULT_LIMITS: Record<
  RateLimitAction,
  { limit: number; windowMs: number }
> = {
  signup: { limit: 5, windowMs: 60 * 60 * 1000 },
  login: { limit: 10, windowMs: 15 * 60 * 1000 },
  verification_upload: { limit: 5, windowMs: 60 * 60 * 1000 },
  report: { limit: 10, windowMs: 60 * 60 * 1000 },
};

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
};

export type RateLimitOk = {
  ok: true;
  remaining: number;
  resetAt: number;
};

export type RateLimitDenied = {
  ok: false;
  remaining: 0;
  resetAt: number;
  retryAfterSec: number;
};

function pruneExpired(now: number) {
  if (buckets.size < 500) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Generic key-based limiter used by server actions.
 * @example rateLimit(`signup:${email}`, 5, 60_000)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitOk | RateLimitDenied {
  const now = Date.now();
  pruneExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return {
    ok: true,
    remaining: Math.max(limit - existing.count, 0),
    resetAt: existing.resetAt,
  };
}

/** Action-scoped helper with built-in windows for sensitive flows. */
export function checkRateLimit(
  action: RateLimitAction,
  identifier: string,
): RateLimitResult {
  const { limit, windowMs } = DEFAULT_LIMITS[action];
  const result = rateLimit(`${action}:${identifier}`, limit, windowMs);

  if (result.ok) {
    return {
      success: true,
      remaining: result.remaining,
      resetAt: result.resetAt,
      limit,
    };
  }

  return {
    success: false,
    remaining: 0,
    resetAt: result.resetAt,
    limit,
  };
}

/** Test helper — clears all buckets. */
export function resetRateLimits() {
  buckets.clear();
}
