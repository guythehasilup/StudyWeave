import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ZodType } from 'zod';
import type { ApiErrorBody } from './error.middleware.js';

/**
 * Create middleware that validates and normalizes an untrusted JSON body.
 *
 * @param schema - Zod schema describing the accepted request body.
 * @returns Express middleware that replaces `request.body` with parsed data.
 * @example
 * router.post('/login', validateBody(loginSchema), loginHandler);
 */
export const validateBody =
  (schema: ZodType): RequestHandler =>
  (request, response, next) => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const body: ApiErrorBody = {
        code: 'VALIDATION_FAILED',
        resourceKey: 'validation.errors.invalidBody',
        correlationId: request.context?.correlationId ?? 'missing-correlation-id',
        details: { fieldErrors: result.error.flatten().fieldErrors },
      };

      response.status(StatusCodes.BAD_REQUEST).json(body);
      return;
    }

    request.body = result.data;
    next();
  };
