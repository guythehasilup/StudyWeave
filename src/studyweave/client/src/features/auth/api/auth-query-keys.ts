/** Stable TanStack Query keys owned by the authentication feature. */
export const authQueryKeys = {
  all: ['auth'] as const,
  /**
   * Build the singleton authenticated-session query key.
   *
   * @returns A stable readonly query-key tuple.
   * @example
   * const queryKey = authQueryKeys.session();
   */
  session: () => [...authQueryKeys.all, 'session'] as const,
};
