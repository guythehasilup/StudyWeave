import type { RateLimiter } from '@studyweave/swwai-contract';
import type { Request, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../errors/api-error.js';
import type { ApiErrorCode, ApiResourceKey } from '../errors/api-error.js';

/** Select the stable bucket key for one authenticated or anonymous request. */
export type RateLimitKeySelector = (request: Request) => string;

/**
 * Configure an HTTP rate-limit boundary around one route or router.
 *
 * @example
 * const options: HttpRateLimitOptions = {
 *   limiter,
 *   getKey: (request) => request.identity!.userId,
 *   errorCode: 'RATE_LIMIT_EXCEEDED',
 *   resourceKey: 'questions.errors.rateLimitExceeded',
 * };
 */
export interface HttpRateLimitOptions {
  readonly limiter: RateLimiter;
  readonly getKey: RateLimitKeySelector;
  readonly errorCode: ApiErrorCode;
  readonly resourceKey: ApiResourceKey;
}

/**
 * Create middleware that rejects a request after its keyed quota is exhausted.
 *
 * Standard quota headers are included for accepted and rejected requests. A
 * rejected request is forwarded to centralized error handling as HTTP 429.
 *
 * @param options - Limiter, key selector, and stable client error identifiers.
 * @returns Express middleware enforcing the injected admission policy.
 * @example
 * router.post('/', createRateLimitMiddleware(options), handler);
 */
export const createRateLimitMiddleware =
  ({ limiter, getKey, errorCode, resourceKey }: HttpRateLimitOptions): RequestHandler =>
  (request, response, next) => {
    const decision = limiter.consume(getKey(request));
    const retryAfterSeconds = Math.max(1, Math.ceil(decision.retryAfterMs / 1_000));
    response.setHeader('RateLimit-Limit', decision.limit);
    response.setHeader('RateLimit-Remaining', decision.remaining);
    response.setHeader('RateLimit-Reset', retryAfterSeconds);

    if (decision.isAllowed) {
      next();
      return;
    }

    response.setHeader('Retry-After', retryAfterSeconds);
    next(
      new ApiError(StatusCodes.TOO_MANY_REQUESTS, errorCode, resourceKey, {
        retryAfterSeconds,
      }),
    );
  };
