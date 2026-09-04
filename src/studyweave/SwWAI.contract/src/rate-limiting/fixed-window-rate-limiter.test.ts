import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFixedWindowRateLimiter } from './fixed-window-rate-limiter.js';

describe('fixed-window rate limiter', () => {
  it('rejects requests beyond one key quota and reports the reset delay', () => {
    const now = { value: 1_000 };
    const limiter = createFixedWindowRateLimiter(
      { maxRequests: 2, windowMs: 1_000 },
      () => now.value,
    );

    assert.deepEqual(limiter.consume('user-1'), {
      isAllowed: true,
      limit: 2,
      remaining: 1,
      retryAfterMs: 1_000,
    });
    assert.equal(limiter.consume('user-1').isAllowed, true);
    assert.deepEqual(limiter.consume('user-1'), {
      isAllowed: false,
      limit: 2,
      remaining: 0,
      retryAfterMs: 1_000,
    });
  });

  it('isolates keys and resets a counter after its window expires', () => {
    const now = { value: 1_000 };
    const limiter = createFixedWindowRateLimiter(
      { maxRequests: 1, windowMs: 1_000 },
      () => now.value,
    );

    assert.equal(limiter.consume('user-1').isAllowed, true);
    assert.equal(limiter.consume('user-2').isAllowed, true);
    assert.equal(limiter.consume('user-1').isAllowed, false);

    now.value = 2_000;
    assert.equal(limiter.consume('user-1').isAllowed, true);
  });

  it('rejects invalid limiter configuration at startup', () => {
    assert.throws(
      () => createFixedWindowRateLimiter({ maxRequests: 0, windowMs: 1_000 }),
      /RATE_LIMIT_CONFIG_MUST_BE_POSITIVE/u,
    );
  });
});
