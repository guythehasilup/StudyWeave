import {
  QUESTION_MESSAGE_TYPES,
  QUESTION_STATUSES,
  createMessageEnvelope,
  isActiveQuestionStatus,
} from '@studyweave/swwai-contract';
import type {
  QuestionContent,
  QuestionDto,
  QuestionMessage,
  QuestionWorkerEvent,
} from '@studyweave/swwai-contract';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import { logError } from '../../common/logging/error-logger.js';
import type { QuestionRepository } from './question.repository.js';

/**
 * Describe validated input accepted by the create-question endpoint.
 *
 * @example
 * const input: CreateQuestionInput = { content: { parts: [{ type: 'text', text: 'Why?' }] } };
 */
export type CreateQuestionInput = Readonly<{
  content: QuestionContent;
}>;

/**
 * Describe validated owner-scoped question route parameters.
 *
 * @example
 * const params: QuestionParams = { questionId };
 */
export type QuestionParams = Readonly<{
  questionId: string;
}>;

/**
 * Publish any message defined by the shared AI contract.
 *
 * @example
 * const publishMessage: QuestionMessagePublisher = (message) => rabbit.publish(route, message);
 */
export type QuestionMessagePublisher = (message: QuestionMessage) => Promise<void>;

/**
 * Collect explicit dependencies for question application operations.
 *
 * @example
 * const dependencies: QuestionServiceDependencies = { questions, publishMessage };
 */
export type QuestionServiceDependencies = Readonly<{
  questions: QuestionRepository;
  publishMessage: QuestionMessagePublisher;
}>;

/**
 * Expose asynchronous question operations to HTTP and RabbitMQ adapters.
 *
 * @example
 * const service = createQuestionService(dependencies);
 */
export type QuestionService = Readonly<{
  create: (
    userId: string,
    input: CreateQuestionInput,
    correlationId: string,
  ) => Promise<QuestionDto>;
  get: (userId: string, questionId: string) => Promise<QuestionDto>;
  cancel: (userId: string, questionId: string, correlationId: string) => Promise<QuestionDto>;
  applyWorkerEvent: (event: QuestionWorkerEvent) => Promise<void>;
}>;

/**
 * Create question submission, polling, cancellation, and worker-event operations.
 *
 * @param dependencies - Server-owned persistence and shared-message publisher.
 * @returns Application operations independent of Express, MongoDB, and RabbitMQ APIs.
 * @example
 * const questions = createQuestionService({ questions: repository, publishMessage });
 */
export const createQuestionService = ({
  questions,
  publishMessage,
}: QuestionServiceDependencies): QuestionService => {
  /**
   * Submit one persisted question to weaveworker without awaiting the AI.
   *
   * @param userId - Authenticated owner identifier.
   * @param input - Validated extensible question content.
   * @param correlationId - Request trace propagated to RabbitMQ.
   * @returns The queued question after broker confirmation.
   * @throws {ApiError} When RabbitMQ does not accept the command.
   * @example
   * const question = await create(userId, input, correlationId);
   */
  const create: QuestionService['create'] = async (userId, input, correlationId) => {
    const question = await questions.createQuestion({ userId, content: input.content });
    const message = createMessageEnvelope(
      QUESTION_MESSAGE_TYPES.answerRequested,
      { questionId: question.id, userId, content: question.content },
      { correlationId },
    );

    try {
      await publishMessage(message);
    } catch (error: unknown) {
      await questions.markDispatchFailed(question.id, userId);
      logError('Question command publication failed', error, {
        questionId: question.id,
        userId,
        correlationId,
      });
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'QUESTION_DISPATCH_FAILED',
        'questions.errors.dispatchFailed',
      );
    }

    return question;
  };

  /**
   * Load one question for its authenticated owner.
   *
   * @param userId - Authenticated owner identifier.
   * @param questionId - Stable public question identifier.
   * @returns The latest owner-scoped question state.
   * @throws {ApiError} When the question does not exist for this owner.
   * @example
   * const question = await get(userId, questionId);
   */
  const get: QuestionService['get'] = async (userId, questionId) => {
    const question = await questions.findQuestionForUser(questionId, userId);

    if (question === null) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'QUESTION_NOT_FOUND', 'questions.errors.notFound');
    }

    return question;
  };

  /**
   * Broadcast best-effort cancellation and return terminal persisted state.
   *
   * @param userId - Authenticated owner identifier.
   * @param questionId - Stable public question identifier.
   * @param correlationId - Request trace propagated to RabbitMQ.
   * @returns The cancelled or already-terminal question.
   * @throws {ApiError} When the question is missing or cancellation cannot be published.
   * @example
   * const question = await cancel(userId, questionId, correlationId);
   */
  const cancel: QuestionService['cancel'] = async (userId, questionId, correlationId) => {
    const question = await get(userId, questionId);
    if (!isActiveQuestionStatus(question.status)) return question;

    const message = createMessageEnvelope(
      QUESTION_MESSAGE_TYPES.cancellationRequested,
      { questionId, userId },
      { correlationId },
    );

    try {
      await publishMessage(message);
    } catch (error: unknown) {
      logError('Question cancellation publication failed', error, {
        questionId,
        userId,
        correlationId,
      });
      throw new ApiError(
        StatusCodes.SERVICE_UNAVAILABLE,
        'QUESTION_CANCELLATION_FAILED',
        'questions.errors.cancellationFailed',
      );
    }

    return (await questions.markCancelledByUser(questionId, userId)) ?? question;
  };

  /**
   * Apply a validated worker event through guarded, idempotent persistence.
   *
   * @param event - Runtime-validated status or result event.
   * @returns A promise resolving after its state transition is attempted.
   * @example
   * await applyWorkerEvent(event);
   */
  const applyWorkerEvent: QuestionService['applyWorkerEvent'] = async (event) => {
    const baseUpdate = {
      questionId: event.payload.questionId,
      userId: event.payload.userId,
      messageId: event.messageId,
      occurredAt: new Date(event.occurredAt),
    } as const;

    switch (event.type) {
      case QUESTION_MESSAGE_TYPES.processingStarted:
        await questions.applyWorkerUpdate({
          ...baseUpdate,
          status: QUESTION_STATUSES.processing,
        });
        return;
      case QUESTION_MESSAGE_TYPES.answerCompleted:
        await questions.applyWorkerUpdate({
          ...baseUpdate,
          status: QUESTION_STATUSES.completed,
          answer: event.payload.answer,
        });
        return;
      case QUESTION_MESSAGE_TYPES.answerFailed:
        await questions.applyWorkerUpdate({
          ...baseUpdate,
          status: QUESTION_STATUSES.failed,
          errorCode: event.payload.errorCode,
        });
        return;
      case QUESTION_MESSAGE_TYPES.answerCancelled:
        await questions.applyWorkerUpdate({
          ...baseUpdate,
          status: QUESTION_STATUSES.cancelled,
        });
    }
  };

  return { create, get, cancel, applyWorkerEvent };
};
