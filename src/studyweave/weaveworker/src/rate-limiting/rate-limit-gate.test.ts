import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RateLimiter } from '@studyweave/swwai-contract';
import { createFixedWindowRateLimiter } from '@studyweave/swwai-contract';
import { createRateLimitGate } from './rate-limit-gate.js';

describe('worker rate limit gate', () => {
  it('resolves immediately when a permit is available', async () => {
    const limiter = createFixedWindowRateLimiter({ maxRequests: 1, windowMs: 60_000 });
    const acquirePermit = createRateLimitGate(limiter, 'openai');

    await acquirePermit(new AbortController().signal);
  });

  it('stops waiting when question processing is cancelled', async () => {
    const limiter: RateLimiter = {
      consume: () => ({
        isAllowed: false,
        limit: 1,
        remaining: 0,
        retryAfterMs: 60_000,
      }),
      clear: () => undefined,
    };
    const acquirePermit = createRateLimitGate(limiter, 'openai');
    const controller = new AbortController();
    const pendingPermit = acquirePermit(controller.signal);

    controller.abort(new Error('QUESTION_CANCELLED'));

    await assert.rejects(pendingPermit, /QUESTION_CANCELLED/u);
  });
});
