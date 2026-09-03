import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { QuestionService } from './question.service.js';

/**
 * Return request identity after protected-route authentication.
 *
 * @param request - Authenticated Express request.
 * @returns Identity attached by authentication middleware.
 * @example
 * const identity = getIdentity(request);
 */
const getIdentity = (request: Parameters<RequestHandler>[0]) => request.identity!;

/**
 * Return request correlation initialized by global middleware.
 *
 * @param request - Express request carrying optional tracing context.
 * @returns Correlation identifier or a stable diagnostic fallback.
 * @example
 * const correlationId = getCorrelationId(request);
 */
const getCorrelationId = (request: Parameters<RequestHandler>[0]): string =>
  request.context?.correlationId ?? 'missing-correlation-id';

/**
 * Return the question identifier already validated by route middleware.
 *
 * @param request - Express request with validated question parameters.
 * @returns Validated UUID parameter.
 * @example
 * const questionId = getQuestionId(request);
 */
const getQuestionId = (request: Parameters<RequestHandler>[0]): string =>
  request.params.questionId as string;

/**
 * Create the asynchronous question-submission HTTP handler.
 *
 * @param questions - Injected question application service.
 * @returns Express handler that responds `202` after durable queue acceptance.
 * @example
 * router.post('/', createQuestionHandler(questions));
 */
export const createQuestionHandler =
  (questions: QuestionService): RequestHandler =>
  async (request, response, next) => {
    try {
      const question = await questions.create(
        getIdentity(request).userId,
        request.body,
        getCorrelationId(request),
      );
      response.status(StatusCodes.ACCEPTED).json(question);
    } catch (error: unknown) {
      next(error);
    }
  };

/**
 * Create the owner-scoped question polling HTTP handler.
 *
 * @param questions - Injected question application service.
 * @returns Express handler that returns the latest question state.
 * @example
 * router.get('/:questionId', getQuestionHandler(questions));
 */
export const getQuestionHandler =
  (questions: QuestionService): RequestHandler =>
  async (request, response, next) => {
    try {
      const question = await questions.get(getIdentity(request).userId, getQuestionId(request));
      response.status(StatusCodes.OK).json(question);
    } catch (error: unknown) {
      next(error);
    }
  };

/**
 * Create the best-effort question-cancellation HTTP handler.
 *
 * @param questions - Injected question application service.
 * @returns Express handler that returns the latest accepted state.
 * @example
 * router.post('/:questionId/cancellations', cancelQuestionHandler(questions));
 */
export const cancelQuestionHandler =
  (questions: QuestionService): RequestHandler =>
  async (request, response, next) => {
    try {
      const question = await questions.cancel(
        getIdentity(request).userId,
        getQuestionId(request),
        getCorrelationId(request),
      );
      response.status(StatusCodes.ACCEPTED).json(question);
    } catch (error: unknown) {
      next(error);
    }
  };
