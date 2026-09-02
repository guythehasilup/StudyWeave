import { Router } from 'express';
import { validateBody } from '../../common/http/validate-body.middleware.js';
import type { AuthService } from './auth.service.js';
import { createLoginHandler, createRegisterHandler } from './auth.controller.js';
import { loginSchema, registerSchema } from './auth.schemas.js';

/**
 * Compose authentication routes with boundary validation and injected operations.
 *
 * @param auth - Authentication application service.
 * @returns Router exposing `/login` and `/register`.
 * @example
 * app.use('/api/auth', createAuthRouter(auth));
 */
export const createAuthRouter = (auth: AuthService): Router => {
  const router = Router();

  router.post('/login', validateBody(loginSchema), createLoginHandler(auth));
  router.post('/register', validateBody(registerSchema), createRegisterHandler(auth));

  return router;
};
