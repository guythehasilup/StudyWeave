import { Router } from 'express';
import { StatusCodes } from 'http-status-codes';

const SERVICE_NAME = 'studyweave-api';
const API_VERSION = '0.1.0';

/**
 * Describe the technical API metadata returned from the service root.
 *
 * @example
 * const info: ApiInfoDto = { name: 'studyweave-api', version: '0.1.0' };
 */
export type ApiInfoDto = Readonly<{
  name: typeof SERVICE_NAME;
  version: typeof API_VERSION;
}>;

/**
 * Describe the liveness response, which intentionally avoids dependency checks.
 *
 * @example
 * const health: HealthDto = { status: 'ok' };
 */
export type HealthDto = Readonly<{
  status: 'ok';
}>;

/**
 * Create liveness and API metadata routes.
 *
 * @returns Router exposing `/` and `/api/health`.
 * @example
 * app.use(createSystemRouter());
 */
export const createSystemRouter = (): Router => {
  const router = Router();

  router.get('/', (_request, response) => {
    const body: ApiInfoDto = { name: SERVICE_NAME, version: API_VERSION };
    response.status(StatusCodes.OK).json(body);
  });
  router.get('/api/health', (_request, response) => {
    const body: HealthDto = { status: 'ok' };
    response.status(StatusCodes.OK).json(body);
  });

  return router;
};
