import { z } from 'zod';
import { questionContentSchema } from '../questions/question.js';
import { createMessageSchema } from './message-envelope.js';

export const QUESTION_MESSAGE_TYPES = {
  answerRequested: 'question.answer.requested.v1',
  cancellationRequested: 'question.answer.cancellation-requested.v1',
  processingStarted: 'question.answer.processing-started.v1',
  answerCompleted: 'question.answer.completed.v1',
  answerFailed: 'question.answer.failed.v1',
  answerCancelled: 'question.answer.cancelled.v1',
} as const;

/**
 * Stable type identifier for messages exchanged by the API and worker.
 *
 * @example
 * const type: QuestionMessageType = QUESTION_MESSAGE_TYPES.answerRequested;
 */
export type QuestionMessageType =
  (typeof QUESTION_MESSAGE_TYPES)[keyof typeof QUESTION_MESSAGE_TYPES];

const questionIdentityShape = {
  questionId: z.string().uuid(),
  userId: z.string().uuid(),
} as const;

/** Validate a request for the worker to generate an answer. */
export const questionAnswerRequestedPayloadSchema = z
  .object({
    ...questionIdentityShape,
    content: questionContentSchema,
  })
  .readonly();

/** Validate a request to stop an in-flight answer. */
export const questionCancellationRequestedPayloadSchema = z
  .object(questionIdentityShape)
  .readonly();

/** Validate notification that a worker began processing. */
export const questionProcessingStartedPayloadSchema = z.object(questionIdentityShape).readonly();

/** Validate a completed AI answer and its optional provider trace ID. */
export const questionAnswerCompletedPayloadSchema = z
  .object({
    ...questionIdentityShape,
    answer: z.string().min(1),
    providerResponseId: z.string().min(1).nullable(),
  })
  .readonly();

/** Validate a stable worker failure without exposing provider details. */
export const questionAnswerFailedPayloadSchema = z
  .object({
    ...questionIdentityShape,
    errorCode: z.string().min(1).max(128),
  })
  .readonly();

/** Validate notification that generation stopped after cancellation. */
export const questionAnswerCancelledPayloadSchema = z.object(questionIdentityShape).readonly();

export const questionAnswerRequestedMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.answerRequested,
  questionAnswerRequestedPayloadSchema,
);
export const questionCancellationRequestedMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.cancellationRequested,
  questionCancellationRequestedPayloadSchema,
);
export const questionProcessingStartedMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.processingStarted,
  questionProcessingStartedPayloadSchema,
);
export const questionAnswerCompletedMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.answerCompleted,
  questionAnswerCompletedPayloadSchema,
);
export const questionAnswerFailedMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.answerFailed,
  questionAnswerFailedPayloadSchema,
);
export const questionAnswerCancelledMessageSchema = createMessageSchema(
  QUESTION_MESSAGE_TYPES.answerCancelled,
  questionAnswerCancelledPayloadSchema,
);

/** Validate any command consumed by `weaveworker`. */
export const questionWorkerCommandSchema = z.discriminatedUnion('type', [
  questionAnswerRequestedMessageSchema,
  questionCancellationRequestedMessageSchema,
]);

/** Validate any worker event consumed by the StudyWeave server. */
export const questionWorkerEventSchema = z.discriminatedUnion('type', [
  questionProcessingStartedMessageSchema,
  questionAnswerCompletedMessageSchema,
  questionAnswerFailedMessageSchema,
  questionAnswerCancelledMessageSchema,
]);

/** Versioned command asking the worker to generate an answer. */
export type QuestionAnswerRequestedMessage = z.infer<typeof questionAnswerRequestedMessageSchema>;

/** Versioned command asking workers to stop generation. */
export type QuestionCancellationRequestedMessage = z.infer<
  typeof questionCancellationRequestedMessageSchema
>;

/** Versioned event emitted when worker processing begins. */
export type QuestionProcessingStartedMessage = z.infer<
  typeof questionProcessingStartedMessageSchema
>;

/** Versioned event containing a completed AI answer. */
export type QuestionAnswerCompletedMessage = z.infer<typeof questionAnswerCompletedMessageSchema>;

/** Versioned event containing a stable worker failure code. */
export type QuestionAnswerFailedMessage = z.infer<typeof questionAnswerFailedMessageSchema>;

/** Versioned event confirming cancellation. */
export type QuestionAnswerCancelledMessage = z.infer<typeof questionAnswerCancelledMessageSchema>;

/** Any validated command consumed by `weaveworker`. */
export type QuestionWorkerCommand = z.infer<typeof questionWorkerCommandSchema>;

/** Any validated status or result event consumed by the API. */
export type QuestionWorkerEvent = z.infer<typeof questionWorkerEventSchema>;

/** Any message supported by the current AI integration contract. */
export type QuestionMessage = QuestionWorkerCommand | QuestionWorkerEvent;
