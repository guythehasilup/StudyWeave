import {
  QUESTION_MESSAGE_TYPES,
  createMessageEnvelope,
  logError,
} from '@studyweave/swwai-contract';
import type {
  QuestionAnswerRequestedMessage,
  QuestionCancellationRequestedMessage,
  QuestionWorkerEvent,
} from '@studyweave/swwai-contract';
import type { AnswerGenerator } from './answer-generator.js';
import type { CancellationRegistry } from './cancellation-registry.js';

/**
 * Publish worker-authored status and result events.
 *
 * @example
 * const publishEvent: QuestionEventPublisher = (event) => rabbit.publish(route, event);
 */
export type QuestionEventPublisher = (event: QuestionWorkerEvent) => Promise<void>;

/**
 * Collect dependencies required to process asynchronous questions.
 *
 * @example
 * const dependencies: QuestionProcessorDependencies = { generateAnswer, cancellations, publishEvent };
 */
export type QuestionProcessorDependencies = Readonly<{
  generateAnswer: AnswerGenerator;
  cancellations: CancellationRegistry;
  publishEvent: QuestionEventPublisher;
}>;

/**
 * Expose command handlers and bounded in-flight lifecycle controls.
 *
 * @example
 * const processor = createQuestionProcessor(dependencies);
 */
export type QuestionProcessor = Readonly<{
  handleRequest: (message: QuestionAnswerRequestedMessage) => Promise<void>;
  handleCancellation: (message: QuestionCancellationRequestedMessage) => Promise<void>;
  cancelAll: () => void;
  waitForIdle: (timeoutMs: number) => Promise<void>;
}>;

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
}: QuestionProcessorDependencies): QuestionProcessor => {
  const inFlightRequests = new Map<string, Promise<void>>();

  /**
   * Publish a cancellation event caused by the original answer request.
   *
   * @param message - Original answer request.
   * @returns A promise resolving after publisher confirmation.
   * @example
   * await publishCancelled(message);
   */
  const publishCancelled = async (message: QuestionAnswerRequestedMessage): Promise<void> => {
    await publishEvent(
      createMessageEnvelope(
        QUESTION_MESSAGE_TYPES.answerCancelled,
        { questionId: message.payload.questionId, userId: message.payload.userId },
        { correlationId: message.correlationId, causationId: message.messageId },
      ),
    );
  };

  /**
   * Execute one answer request and emit processing plus one terminal event.
   *
   * @param message - Validated answer request command.
   * @returns A promise resolving after its terminal event is confirmed.
   * @example
   * await processRequest(message);
   */
  const processRequest = async (message: QuestionAnswerRequestedMessage): Promise<void> => {
    const { questionId, userId, content } = message.payload;
    const signal = cancellations.register(questionId);

    try {
      if (signal.aborted) {
        await publishCancelled(message);
        return;
      }

      await publishEvent(
        createMessageEnvelope(
          QUESTION_MESSAGE_TYPES.processingStarted,
          { questionId, userId },
          { correlationId: message.correlationId, causationId: message.messageId },
        ),
      );
      const generation = await generateAnswer(content, signal).then(
        (result) => ({ ok: true, result }) as const,
        (error: unknown) => ({ ok: false, error }) as const,
      );

      if (!generation.ok) {
        if (signal.aborted) {
          await publishCancelled(message);
          return;
        }

        logError('AI answer generation failed', generation.error, {
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
        return;
      }
      const { result } = generation;

      if (signal.aborted) {
        await publishCancelled(message);
        return;
      }

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
    } finally {
      cancellations.release(questionId);
    }
  };

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

    const request = processRequest(message);
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
