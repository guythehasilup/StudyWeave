import { setTimeout as delay } from 'node:timers/promises';
import type { RateLimiter } from '@studyweave/swwai-contract';

/** Wait until one worker execution permit is available. */
export type ExecutionPermitAcquirer = (signal: AbortSignal) => Promise<void>;

/**
 * Create an abortable gate that waits instead of discarding rate-limited work.
 *
 * @param limiter - Synchronous admission limiter shared by worker deliveries.
 * @param key - Stable bucket key for the downstream dependency.
 * @returns An operation that resolves after consuming one permit.
 * @example
 * const acquirePermit = createRateLimitGate(limiter, 'openai');
 */
export const createRateLimitGate =
  (limiter: RateLimiter, key: string): ExecutionPermitAcquirer =>
  async (signal) => {
    while (true) {
      if (signal.aborted) throw signal.reason;

      const decision = limiter.consume(key);
      if (decision.isAllowed) return;

      try {
        await delay(decision.retryAfterMs, undefined, { signal });
      } catch (error: unknown) {
        if (signal.aborted) throw signal.reason;
        throw error;
      }
    }
  };
