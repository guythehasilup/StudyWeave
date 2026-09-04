import {
  QUESTION_MESSAGE_TYPES,
  createMessageEnvelope,
  logError,
} from '@studyweave/swwai-contract';
import type { ErrorLogger, QuestionAnswerRequestedMessage } from '@studyweave/swwai-contract';
import type { CancellationRegistry } from './cancellation-registry.js';
import type { QuestionEventPublisher } from './question-event-publisher.js';

/** Execute one question using its cancellation signal. */
export type QuestionExecution = (
  message: QuestionAnswerRequestedMessage,
  signal: AbortSignal,
) => Promise<void>;

/**
 * Collect dependencies for the worker's question error boundary.
 *
 * @property logProcessingError - Error-level logger. Defaults to the shared service logger.
 * @example
 * const dependencies: QuestionErrorMiddlewareDependencies = { cancellations, publishEvent };
 */
export interface QuestionErrorMiddlewareDependencies {
  readonly cancellations: CancellationRegistry;
  readonly publishEvent: QuestionEventPublisher;
  readonly logProcessingError?: ErrorLogger;
}

/** Handle one question request after worker middleware has been composed. */
export type QuestionRequestHandler = (message: QuestionAnswerRequestedMessage) => Promise<void>;

/** Wrap a question execution operation in the worker error boundary. */
export type QuestionErrorMiddleware = (execute: QuestionExecution) => QuestionRequestHandler;

/**
 * Create cancellation-aware error middleware for question execution.
 *
 * Provider failures are logged once here and translated into a worker failure
 * event. Aborted requests emit cancellation instead and are not error logs.
 *
 * @param dependencies - Cancellation registry, event publisher, and optional logger.
 * @returns Middleware that owns request signal registration, failures, and cleanup.
 * @example
 * const processQuestion = createQuestionErrorMiddleware(dependencies)(executeQuestion);
 */
export const createQuestionErrorMiddleware =
  ({
    cancellations,
    publishEvent,
    logProcessingError = logError,
  }: QuestionErrorMiddlewareDependencies): QuestionErrorMiddleware =>
  (execute) =>
  async (message) => {
    const { questionId, userId } = message.payload;
    const signal = cancellations.register(questionId);

    try {
      await execute(message, signal);
    } catch (error: unknown) {
      if (signal.aborted) {
        await publishEvent(
          createMessageEnvelope(
            QUESTION_MESSAGE_TYPES.answerCancelled,
            { questionId, userId },
            { correlationId: message.correlationId, causationId: message.messageId },
          ),
        );
        return;
      }

      logProcessingError('Question processing failed', error, {
        questionId,
        userId,
        correlationId: message.correlationId,
      });
      await publishEvent(
        createMessageEnvelope(
          QUESTION_MESSAGE_TYPES.answerFailed,
          { questionId, userId, errorCode: 'AI_PROVIDER_FAILED' },
          { correlationId: message.correlationId, causationId: message.messageId },
        ),
      );
    } finally {
      cancellations.release(questionId);
    }
  };
