import type { Server } from 'node:http';
import {
  AI_RABBITMQ_TOPOLOGY,
  QUESTION_MESSAGE_ROUTES,
  SERVER_EVENTS_SUBSCRIPTION,
  configureErrorStackTraces,
  createFixedWindowRateLimiter,
  createRabbitMqClient,
  logError,
  questionWorkerEventSchema,
} from '@studyweave/swwai-contract';
import type { QuestionMessage } from '@studyweave/swwai-contract';
import { createApplication } from './app.js';
import { loadAppConfig } from './config/environment.js';
import { closeMongoContext, createMongoContext } from './infrastructure/mongodb/mongo-context.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { hashPassword, verifyPassword } from './modules/auth/password.js';
import { createTokenService } from './modules/auth/token.js';
import { createUserRepository, ensureUserIndexes } from './modules/users/user.repository.js';
import {
  createQuestionRepository,
  ensureQuestionIndexes,
} from './modules/questions/question.repository.js';
import { createQuestionRouter } from './modules/questions/question.routes.js';
import { createQuestionService } from './modules/questions/question.service.js';
import type { QuestionMessagePublisher } from './modules/questions/question.service.js';

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
    await Promise.all([
      ensureUserIndexes(mongo.users),
      ensureQuestionIndexes(mongo.questions, mongo.responses),
    ]);

    const rabbit = await createRabbitMqClient(
      {
        url: config.rabbitmqUrl,
        prefetch: config.rabbitmqPrefetch,
        publishConfirmTimeoutMs: config.rabbitmqPublishConfirmTimeoutMs,
      },
      AI_RABBITMQ_TOPOLOGY,
    );

    try {
      const users = createUserRepository(mongo.users);
      const tokens = createTokenService(config);
      const auth = createAuthService({
        users,
        tokens,
        passwords: { hashPassword, verifyPassword },
      });
      const questionRepository = createQuestionRepository(mongo.questions, mongo.responses);
      const questionSubmissionRateLimiter = createFixedWindowRateLimiter({
        maxRequests: config.questionRateLimitMaxRequests,
        windowMs: config.questionRateLimitWindowMs,
      });
      const publishMessage: QuestionMessagePublisher = (message: QuestionMessage) =>
        rabbit.publish(QUESTION_MESSAGE_ROUTES[message.type], message);
      const questions = createQuestionService({ questions: questionRepository, publishMessage });

      // Worker events form the asynchronous return path: each event advances the
      // persisted question state that authenticated clients observe by polling.
      await rabbit.subscribe(
        SERVER_EVENTS_SUBSCRIPTION,
        questionWorkerEventSchema,
        questions.applyWorkerEvent,
      );

      const app = createApplication({
        config,
        authRouter: createAuthRouter(auth),
        questionRouter: createQuestionRouter(questions, tokens, questionSubmissionRateLimiter),
      });
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
        await rabbit.close();
        await closeMongoContext(mongo);
      };

      process.once('SIGINT', () => void handleShutdown('SIGINT'));
      process.once('SIGTERM', () => void handleShutdown('SIGTERM'));
    } catch (error: unknown) {
      await rabbit.close();
      throw error;
    }
  } catch (error: unknown) {
    await closeMongoContext(mongo);
    throw error;
  }
};

configureErrorStackTraces();

void startServer().catch((error: unknown) => {
  logError('Failed to start the StudyWeave server', error);
  process.exitCode = 1;
});
