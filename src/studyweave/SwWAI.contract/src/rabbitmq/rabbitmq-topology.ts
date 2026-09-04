import { QUESTION_MESSAGE_TYPES } from '../messaging/question-messages.js';
import type { QuestionMessageType } from '../messaging/question-messages.js';

/**
 * Describe a RabbitMQ exchange without leaking client-library types.
 *
 * @example
 * const exchange: RabbitMqExchangeDefinition = { name: 'events', type: 'topic', isDurable: true };
 */
export type RabbitMqExchangeDefinition = Readonly<{
  name: string;
  type: 'direct' | 'fanout' | 'topic';
  isDurable: boolean;
}>;

/**
 * Bind a queue to an exchange and routing pattern.
 *
 * @example
 * const binding: RabbitMqBindingDefinition = { exchange: 'events', routingKey: 'question.#' };
 */
export type RabbitMqBindingDefinition = Readonly<{
  exchange: string;
  routingKey: string;
}>;

/**
 * Describe a queue and its delivery bindings.
 *
 * @property deadLetterExchange - Failed-delivery exchange. Defaults to absent.
 * @property deadLetterRoutingKey - Failed-delivery route. Defaults to absent.
 * @example
 * const queue: RabbitMqQueueDefinition = { name: 'worker', isDurable: true, bindings: [] };
 */
export type RabbitMqQueueDefinition = Readonly<{
  name: string;
  isDurable: boolean;
  isExclusive?: boolean;
  isAutoDelete?: boolean;
  deadLetterExchange?: string;
  deadLetterRoutingKey?: string;
  bindings: readonly RabbitMqBindingDefinition[];
}>;

/**
 * Collect exchanges and queues asserted by a RabbitMQ client.
 *
 * @example
 * const topology: RabbitMqTopology = AI_RABBITMQ_TOPOLOGY;
 */
export type RabbitMqTopology = Readonly<{
  exchanges: readonly RabbitMqExchangeDefinition[];
  queues: readonly RabbitMqQueueDefinition[];
}>;

/**
 * Select the exchange and routing key for one published message.
 *
 * @example
 * const route: RabbitMqPublishRoute = QUESTION_MESSAGE_ROUTES['question.answer.requested.v1'];
 */
export type RabbitMqPublishRoute = Readonly<{
  exchange: string;
  routingKey: string;
}>;

const COMMANDS_EXCHANGE = 'studyweave.ai.commands.v1';
const CANCELLATIONS_EXCHANGE = 'studyweave.ai.cancellations.v1';
const EVENTS_EXCHANGE = 'studyweave.ai.events.v1';
const DEAD_LETTERS_EXCHANGE = 'studyweave.ai.dead-letters.v1';
const WORKER_REQUESTS_QUEUE = 'weaveworker.question-requests.v1';
const SERVER_EVENTS_QUEUE = 'studyweave-server.question-events.v1';
const DEAD_LETTERS_QUEUE = 'studyweave.ai.dead-letters.v1';

/** RabbitMQ routes for every versioned question message. */
export const QUESTION_MESSAGE_ROUTES: Readonly<Record<QuestionMessageType, RabbitMqPublishRoute>> =
  {
    [QUESTION_MESSAGE_TYPES.answerRequested]: {
      exchange: COMMANDS_EXCHANGE,
      routingKey: QUESTION_MESSAGE_TYPES.answerRequested,
    },
    [QUESTION_MESSAGE_TYPES.cancellationRequested]: {
      exchange: CANCELLATIONS_EXCHANGE,
      routingKey: '',
    },
    [QUESTION_MESSAGE_TYPES.processingStarted]: {
      exchange: EVENTS_EXCHANGE,
      routingKey: QUESTION_MESSAGE_TYPES.processingStarted,
    },
    [QUESTION_MESSAGE_TYPES.answerCompleted]: {
      exchange: EVENTS_EXCHANGE,
      routingKey: QUESTION_MESSAGE_TYPES.answerCompleted,
    },
    [QUESTION_MESSAGE_TYPES.answerFailed]: {
      exchange: EVENTS_EXCHANGE,
      routingKey: QUESTION_MESSAGE_TYPES.answerFailed,
    },
    [QUESTION_MESSAGE_TYPES.answerCancelled]: {
      exchange: EVENTS_EXCHANGE,
      routingKey: QUESTION_MESSAGE_TYPES.answerCancelled,
    },
  };

/** Durable topology shared by the API and worker processes. */
export const AI_RABBITMQ_TOPOLOGY: RabbitMqTopology = {
  exchanges: [
    { name: COMMANDS_EXCHANGE, type: 'direct', isDurable: true },
    { name: CANCELLATIONS_EXCHANGE, type: 'fanout', isDurable: true },
    { name: EVENTS_EXCHANGE, type: 'topic', isDurable: true },
    { name: DEAD_LETTERS_EXCHANGE, type: 'topic', isDurable: true },
  ],
  queues: [
    {
      name: WORKER_REQUESTS_QUEUE,
      isDurable: true,
      deadLetterExchange: DEAD_LETTERS_EXCHANGE,
      deadLetterRoutingKey: 'weaveworker.question-requests',
      bindings: [
        {
          exchange: COMMANDS_EXCHANGE,
          routingKey: QUESTION_MESSAGE_TYPES.answerRequested,
        },
      ],
    },
    {
      name: SERVER_EVENTS_QUEUE,
      isDurable: true,
      deadLetterExchange: DEAD_LETTERS_EXCHANGE,
      deadLetterRoutingKey: 'studyweave-server.question-events',
      bindings: [{ exchange: EVENTS_EXCHANGE, routingKey: 'question.answer.*.v1' }],
    },
    {
      name: DEAD_LETTERS_QUEUE,
      isDurable: true,
      bindings: [{ exchange: DEAD_LETTERS_EXCHANGE, routingKey: '#' }],
    },
  ],
};

/** Durable competing-consumer subscription for AI answer requests. */
export const WORKER_REQUESTS_SUBSCRIPTION: RabbitMqQueueDefinition = AI_RABBITMQ_TOPOLOGY.queues[0];

/** Durable competing-consumer subscription for worker status and result events. */
export const SERVER_EVENTS_SUBSCRIPTION: RabbitMqQueueDefinition = AI_RABBITMQ_TOPOLOGY.queues[1];

/**
 * Create an ephemeral cancellation subscription for one worker process.
 *
 * Fan-out is required because a cancellation must reach the process that owns
 * the matching in-flight `AbortController`, even when workers are replicated.
 *
 * @returns An exclusive server-named queue bound to cancellation broadcasts.
 * @example
 * await rabbit.subscribe(createWorkerCancellationSubscription(), schema, handler);
 */
export const createWorkerCancellationSubscription = (): RabbitMqQueueDefinition => ({
  name: '',
  isDurable: false,
  isExclusive: true,
  isAutoDelete: true,
  bindings: [{ exchange: CANCELLATIONS_EXCHANGE, routingKey: '' }],
});
