import type { QuestionContent } from '@studyweave/swwai-contract';

/**
 * Describe a provider-neutral generated answer.
 *
 * @property providerResponseId - Provider trace identifier. Defaults to null when unavailable.
 * @example
 * const result: GeneratedAnswer = { answer: 'Inertia is...', providerResponseId: 'resp_123' };
 */
export type GeneratedAnswer = Readonly<{
  answer: string;
  providerResponseId: string | null;
}>;

/**
 * Generate an answer from extensible question content.
 *
 * @example
 * const generate: AnswerGenerator = async (content, signal) => ({ answer: '...', providerResponseId: null });
 */
export type AnswerGenerator = (
  content: QuestionContent,
  signal: AbortSignal,
) => Promise<GeneratedAnswer>;
