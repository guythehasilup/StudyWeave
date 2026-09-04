import { QUESTION_MESSAGE_TYPES, createMessageEnvelope } from '@studyweave/swwai-contract';
import type {
  ErrorLogger,
  QuestionAnswerRequestedMessage,
  QuestionCancellationRequestedMessage,
} from '@studyweave/swwai-contract';
import type { AnswerGenerator } from './answer-generator.js';
import type { CancellationRegistry } from './cancellation-registry.js';
import { createQuestionErrorMiddleware } from './question-error.middleware.js';
import type { QuestionExecution } from './question-error.middleware.js';
import type { QuestionEventPublisher } from './question-event-publisher.js';
import type { ExecutionPermitAcquirer } from '../rate-limiting/rate-limit-gate.js';

/**
 * Collect dependencies required to process asynchronous questions.
 *
 * @example
 * const dependencies: QuestionProcessorDependencies = { generateAnswer, cancellations, publishEvent };
 */
export interface QuestionProcessorDependencies {
  readonly generateAnswer: AnswerGenerator;
  readonly cancellations: CancellationRegistry;
  readonly publishEvent: QuestionEventPublisher;
  readonly acquireExecutionPermit: ExecutionPermitAcquirer;
  readonly logProcessingError?: ErrorLogger;
}

/**
 * Expose command handlers and bounded in-flight lifecycle controls.
 *
 * @example
 * const processor = createQuestionProcessor(dependencies);
 */
export interface QuestionProcessor {
  readonly handleRequest: (message: QuestionAnswerRequestedMessage) => Promise<void>;
  readonly handleCancellation: (message: QuestionCancellationRequestedMessage) => Promise<void>;
  readonly cancelAll: () => void;
  readonly waitForIdle: (timeoutMs: number) => Promise<void>;
}

/**
 * Create command handlers that publish an observable event for every lifecycle stage.
 *
 * @param dependencies - Provider adapter, cancellation registry, and event publisher.
 * @returns Request and cancellation handlers with graceful-shutdown controls.
 * @example
 * const processor = createQuestionProcessor({ generateAnswer, cancellations, publishEvent });
 */
export const createQuestionProcessor = ({
  generateAnswer,
  cancellations,
  publishEvent,
  acquireExecutionPermit,
  logProcessingError,
}: QuestionProcessorDependencies): QuestionProcessor => {
  const inFlightRequests = new Map<string, Promise<void>>();

  /**
   * Execute one answer request and emit its successful lifecycle events.
   *
   * @param message - Validated answer request command.
   * @param signal - Cancellation signal registered by error middleware.
   * @returns A promise resolving after its terminal event is confirmed.
   * @example
   * await executeQuestion(message, signal);
   */
  const executeQuestion: QuestionExecution = async (message, signal) => {
    const { questionId, userId, content } = message.payload;
    if (signal.aborted) throw signal.reason;
    await acquireExecutionPermit(signal);
    if (signal.aborted) throw signal.reason;

    await publishEvent(
      createMessageEnvelope(
        QUESTION_MESSAGE_TYPES.processingStarted,
        { questionId, userId },
        { correlationId: message.correlationId, causationId: message.messageId },
      ),
    );
    const result = await generateAnswer(content, signal);

    if (signal.aborted) throw signal.reason;

    await publishEvent(
      createMessageEnvelope(
        QUESTION_MESSAGE_TYPES.answerCompleted,
        {
          questionId,
          userId,
          answer: result.answer,
          providerResponseId: result.providerResponseId,
        },
        { correlationId: message.correlationId, causationId: message.messageId },
      ),
    );
  };
  const processQuestion = createQuestionErrorMiddleware({
    cancellations,
    publishEvent,
    ...(logProcessingError === undefined ? {} : { logProcessingError }),
  })(executeQuestion);

  /**
   * Track one request until its terminal event has been confirmed.
   *
   * @param message - Validated answer request command.
   * @returns A promise resolving after processing and tracking cleanup.
   * @example
   * await handleRequest(message);
   */
  const handleRequest = async (message: QuestionAnswerRequestedMessage): Promise<void> => {
    const existingRequest = inFlightRequests.get(message.payload.questionId);
    if (existingRequest !== undefined) {
      await existingRequest;
      return;
    }

    const request = processQuestion(message);
    inFlightRequests.set(message.payload.questionId, request);

    try {
      await request;
    } finally {
      inFlightRequests.delete(message.payload.questionId);
    }
  };

  /**
   * Apply a broadcast cancellation to local or shortly pending work.
   *
   * @param message - Validated cancellation command.
   * @returns An already resolved promise after updating the local registry.
   * @example
   * await handleCancellation(message);
   */
  const handleCancellation = async (
    message: QuestionCancellationRequestedMessage,
  ): Promise<void> => {
    cancellations.cancel(message.payload.questionId);
  };

  /**
   * Abort every request owned by this worker during shutdown.
   *
   * @returns Nothing.
   * @example
   * cancelAll();
   */
  const cancelAll = (): void => cancellations.cancelAll();

  /**
   * Wait for tracked requests to publish terminal events within a deadline.
   *
   * @param timeoutMs - Maximum graceful wait in milliseconds.
   * @returns A promise resolving when idle or when the timeout expires.
   * @example
   * await waitForIdle(10_000);
   */
  const waitForIdle = async (timeoutMs: number): Promise<void> => {
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([
      Promise.allSettled([...inFlightRequests.values()]).then(() => undefined),
      timeout,
    ]);
  };

  return { handleRequest, handleCancellation, cancelAll, waitForIdle };
};
