import cors from 'cors';
import express from 'express';
import type { Router } from 'express';
import { createErrorHandler, notFoundHandler } from './common/http/error.middleware.js';
import { requestContextMiddleware } from './common/http/request-context.middleware.js';
import type { AppConfig } from './config/environment.js';
import { createSystemRouter } from './modules/system/system.routes.js';

/**
 * Collect the validated configuration and feature adapters composed by Express.
 *
 * @example
 * const dependencies: ApplicationDependencies = { config, authRouter };
 */
export type ApplicationDependencies = Readonly<{
  config: AppConfig;
  authRouter: Router;
}>;

/**
 * Compose the HTTP application without starting external resources or a listener.
 *
 * @param dependencies - Validated configuration and the authentication router.
 * @returns A configured Express application suitable for tests or startup.
 * @example
 * const app = createApplication({ config, authRouter });
 */
export const createApplication = ({
  config,
  authRouter,
}: ApplicationDependencies): express.Express => {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestContextMiddleware);
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: '16kb' }));
  app.use(createSystemRouter());
  app.use('/api/auth', authRouter);
  app.use(notFoundHandler);
  app.use(createErrorHandler(config));

  return app;
};
