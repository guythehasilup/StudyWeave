/** Stable TanStack Query keys owned by the questions feature. */
export const questionQueryKeys = {
  all: ['questions'] as const,
  /**
   * Build the cache key for one owner-scoped question.
   *
   * @param questionId - Stable public question identifier.
   * @returns A readonly detail query-key tuple.
   * @example
   * const queryKey = questionQueryKeys.detail(questionId);
   */
  detail: (questionId: string) => [...questionQueryKeys.all, 'detail', questionId] as const,
};
