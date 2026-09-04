import type { Request } from 'express';

/**
 * Return the identity guaranteed by protected-route authentication.
 *
 * @param request - Authenticated Express request.
 * @returns Identity attached by authentication middleware.
 * @example
 * const identity = getRequestIdentity(request);
 */
export const getRequestIdentity = (request: Request): NonNullable<Request['identity']> =>
  request.identity!;

/**
 * Return the correlation identifier initialized by request-context middleware.
 *
 * @param request - Express request carrying optional tracing context.
 * @returns Correlation identifier or a stable diagnostic fallback.
 * @example
 * const correlationId = getRequestCorrelationId(request);
 */
export const getRequestCorrelationId = (request: Request): string =>
  request.context?.correlationId ?? 'missing-correlation-id';
