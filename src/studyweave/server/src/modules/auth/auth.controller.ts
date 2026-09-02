import type { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { AuthService } from './auth.service.js';

/**
 * Create the login HTTP handler around one application operation.
 *
 * @param auth - Injected authentication application service.
 * @returns An Express handler that maps login success to HTTP 200.
 * @example
 * router.post('/login', createLoginHandler(auth));
 */
export const createLoginHandler =
  (auth: AuthService): RequestHandler =>
  async (request, response, next) => {
    try {
      const session = await auth.login(request.body);
      response.status(StatusCodes.OK).json(session);
    } catch (error: unknown) {
      next(error);
    }
  };

/**
 * Create the registration HTTP handler around one application operation.
 *
 * @param auth - Injected authentication application service.
 * @returns An Express handler that maps registration success to HTTP 201.
 * @example
 * router.post('/register', createRegisterHandler(auth));
 */
export const createRegisterHandler =
  (auth: AuthService): RequestHandler =>
  async (request, response, next) => {
    try {
      const session = await auth.register(request.body);
      response.status(StatusCodes.CREATED).json(session);
    } catch (error: unknown) {
      next(error);
    }
  };
