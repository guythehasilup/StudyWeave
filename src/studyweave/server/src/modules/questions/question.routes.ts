import { Router } from 'express';
import type { RateLimiter } from '@studyweave/swwai-contract';
import { createRateLimitMiddleware } from '../../common/http/rate-limit.middleware.js';
import { getRequestIdentity } from '../../common/http/request-values.js';
import { validateBody } from '../../common/http/validate-body.middleware.js';
import { validateParams } from '../../common/http/validate-params.middleware.js';
import type { TokenService } from '../auth/token.js';
import { createAuthenticationMiddleware } from '../auth/authentication.middleware.js';
import {
  cancelQuestionHandler,
  createQuestionHandler,
  getQuestionHandler,
} from './question.controller.js';
import { createQuestionSchema, questionParamsSchema } from './question.schemas.js';
import type { QuestionService } from './question.service.js';

/**
 * Compose authenticated asynchronous question routes.
 *
 * @param questions - Question application service.
 * @param tokens - Access-token verifier protecting every route.
 * @param submissionRateLimiter - Per-user question submission admission policy.
 * @returns Router exposing submission, polling, and cancellation resources.
 * @example
 * app.use('/api/questions', createQuestionRouter(questions, tokens, submissionRateLimiter));
 */
export const createQuestionRouter = (
  questions: QuestionService,
  tokens: Pick<TokenService, 'verifyAccessToken'>,
  submissionRateLimiter: RateLimiter,
): Router => {
  const router = Router();
  const submissionRateLimit = createRateLimitMiddleware({
    limiter: submissionRateLimiter,
    getKey: (request) => getRequestIdentity(request).userId,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    resourceKey: 'questions.errors.rateLimitExceeded',
  });

  router.use(createAuthenticationMiddleware(tokens));
  router.post(
    '/',
    submissionRateLimit,
    validateBody(createQuestionSchema),
    createQuestionHandler(questions),
  );
  router.get('/:questionId', validateParams(questionParamsSchema), getQuestionHandler(questions));
  router.post(
    '/:questionId/cancellations',
    validateParams(questionParamsSchema),
    cancelQuestionHandler(questions),
  );

  return router;
};
