import type { Server } from 'node:http';
import { createApplication } from './app.js';
import { loadAppConfig } from './config/environment.js';
import { closeMongoContext, createMongoContext } from './infrastructure/mongodb/mongo-context.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { hashPassword, verifyPassword } from './modules/auth/password.js';
import { createTokenService } from './modules/auth/token.js';
import { createUserRepository, ensureUserIndexes } from './modules/users/user.repository.js';

/**
 * Stop accepting HTTP requests and wait for the listener to close.
 *
 * @param server - Active Node HTTP server.
 * @param timeoutMs - Maximum graceful wait before startup cleanup continues.
 * @returns A promise that resolves on close or when the timeout expires.
 * @example
 * await closeHttpServer(server, 10_000);
 */
const closeHttpServer = (server: Server, timeoutMs: number): Promise<void> =>
  new Promise((resolve) => {
    const timeout = setTimeout(() => {
      server.closeAllConnections();
      resolve();
    }, timeoutMs);

    server.close(() => {
      clearTimeout(timeout);
      resolve();
    });
  });

/**
 * Connect infrastructure, compose dependencies, listen, and register shutdown.
 *
 * @returns A promise that resolves after startup has completed.
 * @throws {Error} When configuration, MongoDB, indexes, or listening fails.
 * @example
 * await startServer();
 */
const startServer = async (): Promise<void> => {
  const config = loadAppConfig();
  const mongo = await createMongoContext(config);

  try {
    await ensureUserIndexes(mongo.users);

    const users = createUserRepository(mongo.users);
    const tokens = createTokenService(config);
    const auth = createAuthService({
      users,
      tokens,
      passwords: { hashPassword, verifyPassword },
    });
    const app = createApplication({ config, authRouter: createAuthRouter(auth) });
    const server = app.listen(config.port, () => {
      console.info('StudyWeave server listening', { port: config.port });
    });
    let isShuttingDown = false;

    /**
     * Close HTTP before MongoDB when the process receives a termination signal.
     *
     * @param signal - Operating-system signal that initiated shutdown.
     * @returns A promise that resolves after bounded cleanup.
     * @example
     * await handleShutdown('SIGTERM');
     */
    const handleShutdown = async (signal: NodeJS.Signals): Promise<void> => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.info('StudyWeave server shutting down', { signal });
      await closeHttpServer(server, config.shutdownTimeoutMs);
      await closeMongoContext(mongo);
    };

    process.once('SIGINT', () => void handleShutdown('SIGINT'));
    process.once('SIGTERM', () => void handleShutdown('SIGTERM'));
  } catch (error: unknown) {
    await closeMongoContext(mongo);
    throw error;
  }
};

void startServer().catch((error: unknown) => {
  console.error('Failed to start the StudyWeave server', {
    errorName: error instanceof Error ? error.name : 'UnknownError',
  });
  process.exitCode = 1;
});
