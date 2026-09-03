import { Router } from 'express';
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
 * @returns Router exposing submission, polling, and cancellation resources.
 * @example
 * app.use('/api/questions', createQuestionRouter(questions, tokens));
 */
export const createQuestionRouter = (
  questions: QuestionService,
  tokens: Pick<TokenService, 'verifyAccessToken'>,
): Router => {
  const router = Router();

  router.use(createAuthenticationMiddleware(tokens));
  router.post('/', validateBody(createQuestionSchema), createQuestionHandler(questions));
  router.get('/:questionId', validateParams(questionParamsSchema), getQuestionHandler(questions));
  router.post(
    '/:questionId/cancellations',
    validateParams(questionParamsSchema),
    cancelQuestionHandler(questions),
  );

  return router;
};
