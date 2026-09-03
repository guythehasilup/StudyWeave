import type { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AppConfig } from '../../config/environment.js';
import { ApiError } from '../errors/api-error.js';
import type { ApiErrorCode, ApiResourceKey } from '../errors/api-error.js';
import { logError } from '../logging/error-logger.js';

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
export type ApiErrorBody = Readonly<{
  code: ApiErrorCode;
  resourceKey: ApiResourceKey;
  correlationId: string;
  details?: Readonly<Record<string, unknown>>;
}>;

/**
 * Read the correlation identifier initialized by request-context middleware.
 *
 * @param request - Current Express request.
 * @returns The request correlation identifier, or a stable fallback.
 * @example
 * const correlationId = getCorrelationId(request);
 */
const getCorrelationId = (request: Parameters<RequestHandler>[0]): string =>
  request.context?.correlationId ?? 'missing-correlation-id';

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
    correlationId: getCorrelationId(request),
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
    const correlationId = getCorrelationId(request);

    if (error instanceof ApiError) {
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
