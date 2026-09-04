import { logError } from '@studyweave/swwai-contract';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AppConfig } from '../../config/environment.js';
import { ApiError } from '../errors/api-error.js';
import type { ApiErrorCode, ApiResourceKey } from '../errors/api-error.js';
import { getRequestCorrelationId } from './request-values.js';

/**
 * Describe the client-safe error response returned by every failed request.
 *
 * @property details - Optional validated details. Defaults to absent.
 * @example
 * const body: ApiErrorBody = {
 *   code: 'NOT_FOUND',
 *   resourceKey: 'common.errors.notFound',
 *   correlationId: 'request-123',
 * };
 */
export interface ApiErrorBody {
  readonly code: ApiErrorCode;
  readonly resourceKey: ApiResourceKey;
  readonly correlationId: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

/**
 * Return a stable not-found error for unmatched routes.
 *
 * @returns Express middleware for the end of the route chain.
 * @example
 * app.use(notFoundHandler);
 */
export const notFoundHandler: RequestHandler = (request, response) => {
  const body: ApiErrorBody = {
    code: 'NOT_FOUND',
    resourceKey: 'common.errors.notFound',
    correlationId: getRequestCorrelationId(request),
  };

  response.status(StatusCodes.NOT_FOUND).json(body);
};

/**
 * Create the centralized HTTP error adapter.
 *
 * @param config - Validated configuration controlling test log suppression.
 * @returns Express error middleware that hides internal failure details.
 * @example
 * app.use(createErrorHandler(config));
 */
export const createErrorHandler =
  (config: AppConfig): ErrorRequestHandler =>
  (error: unknown, request, response, _next) => {
    const correlationId = getRequestCorrelationId(request);

    if (error instanceof ApiError) {
      if (config.nodeEnv !== 'test' && error.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
        logError('Server request failed', error, {
          ...error.options?.logContext,
          correlationId,
          method: request.method,
          path: request.originalUrl,
          statusCode: error.statusCode,
          errorCode: error.code,
        });
      }

      const body: ApiErrorBody = {
        code: error.code,
        resourceKey: error.resourceKey,
        correlationId,
        ...(error.details === undefined ? {} : { details: error.details }),
      };

      response.status(error.statusCode).json(body);
      return;
    }

    if (config.nodeEnv !== 'test') {
      logError('Unexpected server error', error, {
        correlationId,
        method: request.method,
        path: request.originalUrl,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }

    const body: ApiErrorBody = {
      code: 'INTERNAL_ERROR',
      resourceKey: 'common.errors.internal',
      correlationId,
    };

    response.status(StatusCodes.INTERNAL_SERVER_ERROR).json(body);
  };
