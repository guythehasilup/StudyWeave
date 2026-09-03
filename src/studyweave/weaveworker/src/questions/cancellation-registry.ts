const DEFAULT_PENDING_CANCELLATION_TTL_MS = 10 * 60 * 1_000;

/**
 * Coordinate cancellation broadcasts with requests running in one worker process.
 *
 * @example
 * const cancellations = createCancellationRegistry();
 */
export type CancellationRegistry = Readonly<{
  register: (questionId: string) => AbortSignal;
  cancel: (questionId: string) => void;
  release: (questionId: string) => void;
  cancelAll: () => void;
}>;

/**
 * Create a bounded registry for active and slightly early cancellation requests.
 *
 * @param pendingCancellationTtlMs - How long an early cancellation is retained. Defaults to ten minutes.
 * @returns Per-process cancellation operations backed by AbortController.
 * @example
 * const registry = createCancellationRegistry();
 */
export const createCancellationRegistry = (
  pendingCancellationTtlMs = DEFAULT_PENDING_CANCELLATION_TTL_MS,
): CancellationRegistry => {
  const controllers = new Map<string, AbortController>();
  const pendingCancellations = new Map<string, number>();

  /**
   * Remove early cancellations after their bounded retention period.
   *
   * @returns Nothing.
   * @example
   * removeExpiredCancellations();
   */
  const removeExpiredCancellations = (): void => {
    const oldestAllowedTimestamp = Date.now() - pendingCancellationTtlMs;
    for (const [questionId, requestedAt] of pendingCancellations) {
      if (requestedAt < oldestAllowedTimestamp) pendingCancellations.delete(questionId);
    }
  };

  /**
   * Register an abort signal for a request beginning in this process.
   *
   * @param questionId - Stable question identifier.
   * @returns Signal that may already be aborted by an early cancellation.
   * @example
   * const signal = register(questionId);
   */
  const register = (questionId: string): AbortSignal => {
    removeExpiredCancellations();
    const controller = new AbortController();
    controllers.set(questionId, controller);

    if (pendingCancellations.has(questionId)) {
      pendingCancellations.delete(questionId);
      controller.abort();
    }

    return controller.signal;
  };

  /**
   * Abort a local request or retain an early cancellation briefly.
   *
   * @param questionId - Stable question identifier.
   * @returns Nothing.
   * @example
   * cancel(questionId);
   */
  const cancel = (questionId: string): void => {
    removeExpiredCancellations();
    const controller = controllers.get(questionId);

    if (controller === undefined) pendingCancellations.set(questionId, Date.now());
    else controller.abort();
  };

  /**
   * Release state after one request reaches a terminal event.
   *
   * @param questionId - Stable question identifier.
   * @returns Nothing.
   * @example
   * release(questionId);
   */
  const release = (questionId: string): void => {
    controllers.delete(questionId);
    pendingCancellations.delete(questionId);
  };

  /**
   * Abort every local request during graceful shutdown.
   *
   * @returns Nothing.
   * @example
   * cancelAll();
   */
  const cancelAll = (): void => {
    for (const controller of controllers.values()) controller.abort();
  };

  return { register, cancel, release, cancelAll };
};
