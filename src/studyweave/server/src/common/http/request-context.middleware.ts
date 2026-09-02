import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

const MAX_CORRELATION_ID_LENGTH = 128;

/**
 * Determine whether an incoming correlation identifier is safe to retain.
 *
 * @param value - Untrusted request-header value.
 * @returns `true` for a non-empty printable identifier within the size limit.
 * @example
 * const isValid = isSafeCorrelationId('request-123');
 */
const isSafeCorrelationId = (value: string | undefined): value is string =>
  value !== undefined &&
  value.length > 0 &&
  value.length <= MAX_CORRELATION_ID_LENGTH &&
  /^[\w.:/-]+$/u.test(value);

/**
 * Attach request-scoped tracing metadata and echo it in the response.
 *
 * @returns An Express middleware that initializes `request.context`.
 * @example
 * app.use(requestContextMiddleware);
 */
export const requestContextMiddleware: RequestHandler = (request, response, next) => {
  const requestedCorrelationId = request.header('x-correlation-id')?.trim();
  const correlationId = isSafeCorrelationId(requestedCorrelationId)
    ? requestedCorrelationId
    : randomUUID();

  request.context = { correlationId };
  response.setHeader('x-correlation-id', correlationId);
  next();
};
