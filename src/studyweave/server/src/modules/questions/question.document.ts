import type { QuestionContent, QuestionStatus } from '@studyweave/swwai-contract';

/**
 * Represent one asynchronous question in the server-owned MongoDB collection.
 *
 * @example
 * const question: QuestionDocument = {
 *   id,
 *   userId,
 *   content,
 *   status: 'queued',
 *   responseId: null,
 *   lastWorkerMessageId: null,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 */
export interface QuestionDocument {
  readonly id: string;
  readonly userId: string;
  readonly content: QuestionContent;
  readonly status: QuestionStatus;
  readonly responseId: string | null;
  readonly lastWorkerMessageId: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
