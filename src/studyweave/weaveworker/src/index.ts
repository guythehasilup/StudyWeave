import {
  AI_RABBITMQ_TOPOLOGY,
  QUESTION_MESSAGE_ROUTES,
  WORKER_REQUESTS_SUBSCRIPTION,
  configureErrorStackTraces,
  createFixedWindowRateLimiter,
  createRabbitMqClient,
  createWorkerCancellationSubscription,
  logError,
  questionAnswerRequestedMessageSchema,
  questionCancellationRequestedMessageSchema,
} from '@studyweave/swwai-contract';
import type { QuestionWorkerEvent } from '@studyweave/swwai-contract';
import OpenAI from 'openai';
import { loadWorkerConfig } from './config/environment.js';
import { createOpenAiAnswerGenerator } from './infrastructure/openai/openai-answer-generator.js';
import { createCancellationRegistry } from './questions/cancellation-registry.js';
import type { QuestionEventPublisher } from './questions/question-event-publisher.js';
import { createQuestionProcessor } from './questions/question-processor.js';
import { createRateLimitGate } from './rate-limiting/rate-limit-gate.js';

/**
 * Connect dependencies, start consumers, and register graceful shutdown.
 *
 * @returns A promise that resolves after both worker subscriptions are active.
 * @throws {Error} When configuration, RabbitMQ, or consumer setup fails.
 * @example
 * await startWorker();
 */
const startWorker = async (): Promise<void> => {
  const config = loadWorkerConfig();
  const rabbit = await createRabbitMqClient(
    {
      url: config.rabbitmqUrl,
      prefetch: config.rabbitmqPrefetch,
      publishConfirmTimeoutMs: config.rabbitmqPublishConfirmTimeoutMs,
    },
    AI_RABBITMQ_TOPOLOGY,
  );

  try {
    const openAi = new OpenAI({ apiKey: config.openAiApiKey });
    const cancellations = createCancellationRegistry();
    const openAiRateLimiter = createFixedWindowRateLimiter({
      maxRequests: config.openAiRateLimitMaxRequests,
      windowMs: config.openAiRateLimitWindowMs,
    });
    const publishEvent: QuestionEventPublisher = (event: QuestionWorkerEvent) =>
      rabbit.publish(QUESTION_MESSAGE_ROUTES[event.type], event);
    const processor = createQuestionProcessor({
      cancellations,
      generateAnswer: createOpenAiAnswerGenerator(openAi, config.openAiModel),
      publishEvent,
      acquireExecutionPermit: createRateLimitGate(openAiRateLimiter, 'openai'),
    });

    await rabbit.subscribe(
      createWorkerCancellationSubscription(),
      questionCancellationRequestedMessageSchema,
      processor.handleCancellation,
    );
    await rabbit.subscribe(
      WORKER_REQUESTS_SUBSCRIPTION,
      questionAnswerRequestedMessageSchema,
      processor.handleRequest,
    );

    let isShuttingDown = false;

    /**
     * Stop deliveries, abort local provider calls, and close RabbitMQ.
     *
     * @param signal - Operating-system signal initiating shutdown.
     * @returns A promise that resolves after bounded cleanup.
     * @example
     * await handleShutdown('SIGTERM');
     */
    const handleShutdown = async (signal: NodeJS.Signals): Promise<void> => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.info('weaveworker shutting down', { signal });
      await rabbit.stopConsuming();
      processor.cancelAll();
      await processor.waitForIdle(config.shutdownTimeoutMs);
      await rabbit.close();
    };

    process.once('SIGINT', () => void handleShutdown('SIGINT'));
    process.once('SIGTERM', () => void handleShutdown('SIGTERM'));
    console.info('weaveworker is consuming question requests');
  } catch (error: unknown) {
    await rabbit.close();
    throw error;
  }
};

configureErrorStackTraces();

void startWorker().catch((error: unknown) => {
  logError('Failed to start weaveworker', error);
  process.exitCode = 1;
});
