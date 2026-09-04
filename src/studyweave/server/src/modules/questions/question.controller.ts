import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { getRequestCorrelationId, getRequestIdentity } from '../../common/http/request-values.js';
import type { QuestionService } from './question.service.js';

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
        getRequestIdentity(request).userId,
        request.body,
        getRequestCorrelationId(request),
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
      const question = await questions.get(
        getRequestIdentity(request).userId,
        getQuestionId(request),
      );
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
        getRequestIdentity(request).userId,
        getQuestionId(request),
        getRequestCorrelationId(request),
      );
      response.status(StatusCodes.ACCEPTED).json(question);
    } catch (error: unknown) {
      next(error);
    }
  };
