import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ZodType } from 'zod';
import type { ApiErrorBody } from './error.middleware.js';

/**
 * Create middleware that validates and normalizes untrusted route parameters.
 *
 * @param schema - Zod schema describing the accepted route parameters.
 * @returns Express middleware that replaces `request.params` with parsed values.
 * @example
 * router.get('/:questionId', validateParams(questionParamsSchema), handler);
 */
export const validateParams =
  (schema: ZodType): RequestHandler =>
  (request, response, next) => {
    const result = schema.safeParse(request.params);

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

    request.params = result.data as typeof request.params;
    next();
  };
