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
 *   answer: null,
 *   errorCode: null,
 *   lastWorkerMessageId: null,
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 */
export type QuestionDocument = Readonly<{
  id: string;
  userId: string;
  content: QuestionContent;
  status: QuestionStatus;
  answer: string | null;
  errorCode: string | null;
  lastWorkerMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}>;
