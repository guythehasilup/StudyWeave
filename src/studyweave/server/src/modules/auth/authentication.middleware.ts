import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import type { TokenService } from './token.js';

/**
 * Create bearer-token authentication middleware for protected routes.
 *
 * @param tokens - Injected token verification operation.
 * @returns Express middleware that attaches validated identity or rejects the request.
 * @example
 * router.use(createAuthenticationMiddleware(tokens));
 */
export const createAuthenticationMiddleware =
  (tokens: Pick<TokenService, 'verifyAccessToken'>): RequestHandler =>
  (request, _response, next) => {
    const authorization = request.header('authorization');
    const match = authorization?.match(/^Bearer\s+(.+)$/iu);
    const identity = match ? tokens.verifyAccessToken(match[1]) : null;

    if (!identity) {
      next(
        new ApiError(
          StatusCodes.UNAUTHORIZED,
          'AUTHENTICATION_REQUIRED',
          'auth.errors.authenticationRequired',
        ),
      );
      return;
    }

    request.identity = identity;
    next();
  };
