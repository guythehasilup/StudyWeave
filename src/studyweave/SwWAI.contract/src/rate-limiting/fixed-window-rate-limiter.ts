/**
 * Configure a bounded in-memory fixed-window rate limiter.
 *
 * @property maxRequests - Maximum accepted requests per key and window.
 * @property windowMs - Positive window duration in milliseconds.
 * @property maxTrackedKeys - Maximum retained keys. Defaults to `10_000`.
 * @example
 * const config: FixedWindowRateLimiterConfig = { maxRequests: 10, windowMs: 60_000 };
 */
export interface FixedWindowRateLimiterConfig {
  readonly maxRequests: number;
  readonly windowMs: number;
  readonly maxTrackedKeys?: number;
}

/**
 * Report one rate-limit admission decision.
 *
 * @property retryAfterMs - Time until the current window resets.
 * @example
 * const decision: RateLimitDecision = { isAllowed: true, limit: 10, remaining: 9, retryAfterMs: 60_000 };
 */
export interface RateLimitDecision {
  readonly isAllowed: boolean;
  readonly limit: number;
  readonly remaining: number;
  readonly retryAfterMs: number;
}

/** Expose synchronous admission and explicit state cleanup. */
export interface RateLimiter {
  readonly consume: (key: string) => RateLimitDecision;
  readonly clear: () => void;
}

/** Return the current epoch time in milliseconds. */
export type RateLimitClock = () => number;

/** Track one immutable fixed-window counter. */
interface RateLimitWindow {
  readonly startedAt: number;
  readonly requestCount: number;
}

/**
 * Create an in-memory fixed-window rate limiter suitable for dependency injection.
 *
 * This limiter is deliberately process-local. Callers can later replace it with
 * a distributed implementation through the same `RateLimiter` interface.
 *
 * @param config - Request count, duration, and optional key bound.
 * @param clock - Epoch millisecond provider. Defaults to `Date.now`.
 * @returns A keyed admission limiter with bounded retained state.
 * @throws {RangeError} When a configured numeric value is not a positive integer.
 * @example
 * const limiter = createFixedWindowRateLimiter({ maxRequests: 10, windowMs: 60_000 });
 */
export const createFixedWindowRateLimiter = (
  { maxRequests, windowMs, maxTrackedKeys = 10_000 }: FixedWindowRateLimiterConfig,
  clock: RateLimitClock = Date.now,
): RateLimiter => {
  if (![maxRequests, windowMs, maxTrackedKeys].every(Number.isSafeInteger)) {
    throw new RangeError('RATE_LIMIT_CONFIG_MUST_BE_SAFE_INTEGERS');
  }
  if (maxRequests <= 0 || windowMs <= 0 || maxTrackedKeys <= 0) {
    throw new RangeError('RATE_LIMIT_CONFIG_MUST_BE_POSITIVE');
  }

  const windows = new Map<string, RateLimitWindow>();

  /**
   * Remove expired counters and, if necessary, the oldest retained counter.
   *
   * @param now - Current epoch time used for expiration checks.
   * @returns Nothing after retained state is brought under its configured bound.
   * @example
   * retainCapacity(Date.now());
   */
  const retainCapacity = (now: number): void => {
    if (windows.size < maxTrackedKeys) return;

    for (const [key, window] of windows) {
      if (now - window.startedAt >= windowMs) windows.delete(key);
    }

    if (windows.size < maxTrackedKeys) return;
    const oldestKey = windows.keys().next().value as string | undefined;
    if (oldestKey !== undefined) windows.delete(oldestKey);
  };

  /**
   * Consume one request from the current window for a key.
   *
   * @param key - Stable caller identity or shared dependency bucket.
   * @returns Whether the request is accepted and current quota metadata.
   * @example
   * const decision = consume(userId);
   */
  const consume = (key: string): RateLimitDecision => {
    const now = clock();
    const current = windows.get(key);
    const isExpired = current === undefined || now - current.startedAt >= windowMs;

    if (isExpired) {
      if (current === undefined) retainCapacity(now);
      windows.delete(key);
      windows.set(key, { startedAt: now, requestCount: 1 });
      return {
        isAllowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        retryAfterMs: windowMs,
      };
    }

    const retryAfterMs = Math.max(1, current.startedAt + windowMs - now);
    if (current.requestCount >= maxRequests) {
      return { isAllowed: false, limit: maxRequests, remaining: 0, retryAfterMs };
    }

    const requestCount = current.requestCount + 1;
    windows.set(key, { ...current, requestCount });
    return {
      isAllowed: true,
      limit: maxRequests,
      remaining: maxRequests - requestCount,
      retryAfterMs,
    };
  };

  /** Clear every retained fixed-window counter. */
  const clear = (): void => windows.clear();

  return { consume, clear };
};
