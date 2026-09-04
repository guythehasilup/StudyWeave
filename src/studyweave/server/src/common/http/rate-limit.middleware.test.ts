import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFixedWindowRateLimiter } from '@studyweave/swwai-contract';
import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../errors/api-error.js';
import { createRateLimitMiddleware } from './rate-limit.middleware.js';

/** Build the minimal response adapter required by rate-limit middleware. */
const createResponse = (): Readonly<{
  response: Response;
  headers: Map<string, number | string | readonly string[]>;
}> => {
  const headers = new Map<string, number | string | readonly string[]>();
  const response = {
    setHeader: (name: string, value: number | string | readonly string[]) => {
      headers.set(name, value);
      return response;
    },
  } as unknown as Response;

  return { response, headers };
};

describe('rate limit middleware', () => {
  it('forwards accepted requests with remaining quota headers', () => {
    const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const middleware = createRateLimitMiddleware({
      limiter,
      getKey: () => 'user-1',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      resourceKey: 'questions.errors.rateLimitExceeded',
    });
    const { response, headers } = createResponse();
    const errors: unknown[] = [];
    const next = ((error?: unknown) => errors.push(error)) as NextFunction;

    middleware({} as Request, response, next);

    assert.deepEqual(errors, [undefined]);
    assert.equal(headers.get('RateLimit-Remaining'), 0);
  });

  it('forwards quota exhaustion as a retryable HTTP error', () => {
    const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const middleware = createRateLimitMiddleware({
      limiter,
      getKey: () => 'user-1',
      errorCode: 'RATE_LIMIT_EXCEEDED',
      resourceKey: 'questions.errors.rateLimitExceeded',
    });
    const { response, headers } = createResponse();
    const errors: unknown[] = [];
    const next = ((error?: unknown) => errors.push(error)) as NextFunction;

    middleware({} as Request, response, next);
    middleware({} as Request, response, next);

    const error = errors[1];
    assert.equal(error instanceof ApiError ? error.statusCode : null, 429);
    assert.equal(error instanceof ApiError ? error.code : null, 'RATE_LIMIT_EXCEEDED');
    assert.equal(headers.get('Retry-After'), 60);
  });
});
