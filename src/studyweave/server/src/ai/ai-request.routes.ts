import { Router } from 'express';
import { authenticate } from '../auth/middleware/authentication.middleware.js';
import { validateBody, validateParams } from '../common/middleware/validate.middleware.js';
import { aiRequestController } from './ai-request.controller.js';
import { aiRequestParamsSchema } from './validators/ai-request-params.schema.js';
import { createAiRequestSchema } from './validators/create-ai-request.schema.js';

export const aiRequestRouter = Router();

aiRequestRouter.use(authenticate);
aiRequestRouter.post('/', validateBody(createAiRequestSchema), aiRequestController.create);
aiRequestRouter.get(
  '/:requestId',
  validateParams(aiRequestParamsSchema),
  aiRequestController.getById,
);
aiRequestRouter.post(
  '/:requestId/abort',
  validateParams(aiRequestParamsSchema),
  aiRequestController.abort,
);
