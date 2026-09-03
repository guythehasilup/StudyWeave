import { once } from 'node:events';
import { Buffer } from 'node:buffer';
import { connect } from 'amqplib';
import type { Channel, ChannelModel, ConfirmChannel, ConsumeMessage } from 'amqplib';
import type { ZodType } from 'zod';
import type { MessageEnvelope } from '../messaging/message-envelope.js';
import type {
  RabbitMqPublishRoute,
  RabbitMqQueueDefinition,
  RabbitMqTopology,
} from './rabbitmq-topology.js';

/**
 * Configure the shared RabbitMQ transport.
 *
 * @property prefetch - Concurrent unacknowledged deliveries per subscription. Defaults to `4`.
 * @property publishConfirmTimeoutMs - Publisher-confirm deadline. Defaults to `5000` milliseconds.
 * @example
 * const config: RabbitMqClientConfig = { url: 'amqp://localhost', prefetch: 4 };
 */
export type RabbitMqClientConfig = Readonly<{
  url: string;
  prefetch?: number;
  publishConfirmTimeoutMs?: number;
}>;

/**
 * Handle one already validated message delivery.
 *
 * @example
 * const handler: RabbitMqMessageHandler<Message> = async (message) => process(message);
 */
export type RabbitMqMessageHandler<TMessage> = (message: TMessage) => Promise<void>;

/**
 * Expose confirmed publishing, validated consumption, and bounded lifecycle cleanup.
 *
 * @example
 * const rabbit = await createRabbitMqClient(config, topology);
 */
export type RabbitMqClient = Readonly<{
  publish: <TType extends string, TPayload>(
    route: RabbitMqPublishRoute,
    message: MessageEnvelope<TType, TPayload>,
  ) => Promise<void>;
  subscribe: <TMessage>(
    subscription: RabbitMqQueueDefinition,
    schema: ZodType<TMessage>,
    handler: RabbitMqMessageHandler<TMessage>,
  ) => Promise<void>;
  stopConsuming: () => Promise<void>;
  close: () => Promise<void>;
}>;

/**
 * Reject a promise when an operation exceeds a fixed duration.
 *
 * @param operation - Promise representing the bounded operation.
 * @param timeoutMs - Positive timeout in milliseconds.
 * @param errorCode - Stable error code used when time expires.
 * @returns The original promise result when it settles in time.
 * @throws {Error} When the timeout expires first.
 * @example
 * await withTimeout(channel.waitForConfirms(), 5_000, 'RABBITMQ_CONFIRM_TIMEOUT');
 */
const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorCode: string,
): Promise<T> => {
  const timeoutState: { handle?: ReturnType<typeof setTimeout> } = {};
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutState.handle = setTimeout(() => reject(new Error(errorCode)), timeoutMs);
  });

  try {
    return await Promise.race([operation, timeout]);
  } finally {
    if (timeoutState.handle !== undefined) clearTimeout(timeoutState.handle);
  }
};

/**
 * Assert all durable exchanges, queues, and bindings for a topology.
 *
 * @param channel - RabbitMQ channel used only during initialization.
 * @param topology - Declarative topology shared by participating services.
 * @returns A promise that resolves after every declaration succeeds.
 * @example
 * await assertTopology(channel, AI_RABBITMQ_TOPOLOGY);
 */
const assertTopology = async (channel: Channel, topology: RabbitMqTopology): Promise<void> => {
  for (const exchange of topology.exchanges) {
    await channel.assertExchange(exchange.name, exchange.type, { durable: exchange.isDurable });
  }

  for (const queue of topology.queues) {
    const assertedQueue = await channel.assertQueue(queue.name, {
      durable: queue.isDurable,
      exclusive: queue.isExclusive ?? false,
      autoDelete: queue.isAutoDelete ?? false,
      arguments:
        queue.deadLetterExchange === undefined
          ? undefined
          : {
              'x-dead-letter-exchange': queue.deadLetterExchange,
              ...(queue.deadLetterRoutingKey === undefined
                ? {}
                : { 'x-dead-letter-routing-key': queue.deadLetterRoutingKey }),
            },
    });

    for (const binding of queue.bindings) {
      await channel.bindQueue(assertedQueue.queue, binding.exchange, binding.routingKey);
    }
  }
};

/**
 * Parse an untrusted RabbitMQ body as JSON.
 *
 * @param delivery - Raw delivery containing UTF-8 JSON bytes.
 * @returns Parsed unknown JSON for subsequent schema validation.
 * @throws {SyntaxError} When the body is not valid JSON.
 * @example
 * const value = parseDelivery(delivery);
 */
const parseDelivery = (delivery: ConsumeMessage): unknown =>
  JSON.parse(delivery.content.toString('utf8')) as unknown;

/**
 * Connect a reusable RabbitMQ transport and assert its declared topology.
 *
 * A closure owns mutable connection and channel lifecycle state, avoiding
 * process-wide globals while allowing both applications to reuse one adapter.
 *
 * @param config - Validated broker URL, prefetch, and publisher timeout.
 * @param topology - Exchanges and durable queues required by the application.
 * @returns A connected client with confirmed publish and manual-ack consumption.
 * @throws {Error} When connection or topology setup fails.
 * @example
 * const rabbit = await createRabbitMqClient(config, AI_RABBITMQ_TOPOLOGY);
 */
export const createRabbitMqClient = async (
  { url, prefetch = 4, publishConfirmTimeoutMs = 5_000 }: RabbitMqClientConfig,
  topology: RabbitMqTopology,
): Promise<RabbitMqClient> => {
  const connection: ChannelModel = await connect(url);
  const topologyChannel = await connection.createChannel();

  try {
    await assertTopology(topologyChannel, topology);
  } finally {
    await topologyChannel.close();
  }

  const publishChannel: ConfirmChannel = await connection.createConfirmChannel();
  const consumers: Array<{ channel: Channel; consumerTag?: string }> = [];
  const inFlightDeliveries = new Set<Promise<void>>();

  /**
   * Publish persistent JSON and wait until RabbitMQ confirms broker acceptance.
   *
   * @param route - Destination exchange and routing key.
   * @param message - Versioned message envelope to serialize.
   * @returns A promise that resolves after publisher confirmation.
   * @throws {Error} When flow control, channel failure, or confirmation timeout occurs.
   * @example
   * await publish(route, message);
   */
  const publish: RabbitMqClient['publish'] = async (route, message) => {
    const didWrite = publishChannel.publish(
      route.exchange,
      route.routingKey,
      Buffer.from(JSON.stringify(message)),
      {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId: message.messageId,
        type: message.type,
        correlationId: message.correlationId,
        timestamp: Math.floor(Date.parse(message.occurredAt) / 1_000),
      },
    );

    if (!didWrite) await once(publishChannel, 'drain');
    await withTimeout(
      publishChannel.waitForConfirms(),
      publishConfirmTimeoutMs,
      'RABBITMQ_PUBLISH_CONFIRM_TIMEOUT',
    );
  };

  /**
   * Start a schema-validated manual-ack consumer for one logical subscription.
   *
   * @param subscription - Queue properties and bindings for this consumer.
   * @param schema - Runtime validator applied after JSON parsing.
   * @param handler - Application handler awaited before acknowledgement.
   * @returns A promise that resolves after RabbitMQ registers the consumer.
   * @example
   * await subscribe(subscription, messageSchema, handleMessage);
   */
  const subscribe: RabbitMqClient['subscribe'] = async (subscription, schema, handler) => {
    const channel = await connection.createChannel();
    const consumer = { channel, consumerTag: undefined as string | undefined };
    consumers.push(consumer);
    await channel.prefetch(prefetch);
    const assertedQueue = await channel.assertQueue(subscription.name, {
      durable: subscription.isDurable,
      exclusive: subscription.isExclusive ?? false,
      autoDelete: subscription.isAutoDelete ?? false,
      arguments:
        subscription.deadLetterExchange === undefined
          ? undefined
          : {
              'x-dead-letter-exchange': subscription.deadLetterExchange,
              ...(subscription.deadLetterRoutingKey === undefined
                ? {}
                : { 'x-dead-letter-routing-key': subscription.deadLetterRoutingKey }),
            },
    });

    for (const binding of subscription.bindings) {
      await channel.bindQueue(assertedQueue.queue, binding.exchange, binding.routingKey);
    }

    const result = await channel.consume(
      assertedQueue.queue,
      (delivery) => {
        if (delivery === null) return;

        const processing = (async (): Promise<void> => {
          try {
            const message = schema.parse(parseDelivery(delivery));
            await handler(message);
            channel.ack(delivery);
          } catch (error: unknown) {
            console.error('RabbitMQ delivery failed and was dead-lettered', {
              queue: assertedQueue.queue,
              messageId: delivery.properties.messageId,
              errorName: error instanceof Error ? error.name : 'UnknownError',
            });
            channel.nack(delivery, false, false);
          }
        })();
        inFlightDeliveries.add(processing);
        void processing.then(
          () => inFlightDeliveries.delete(processing),
          () => inFlightDeliveries.delete(processing),
        );
      },
      { noAck: false },
    );
    consumer.consumerTag = result.consumerTag;
  };

  /**
   * Cancel registered consumers so no new deliveries begin during shutdown.
   *
   * @returns A promise that resolves after all known consumer tags are cancelled.
   * @example
   * await rabbit.stopConsuming();
   */
  const stopConsuming = async (): Promise<void> => {
    await Promise.allSettled(
      consumers.map(async ({ channel, consumerTag }) => {
        if (consumerTag !== undefined) await channel.cancel(consumerTag);
      }),
    );
  };

  /**
   * Close consumer channels before the publisher and shared connection.
   *
   * @returns A promise that resolves after RabbitMQ resources close.
   * @example
   * await rabbit.close();
   */
  const close = async (): Promise<void> => {
    await stopConsuming();
    await Promise.allSettled([...inFlightDeliveries]);
    await Promise.allSettled(consumers.map(async ({ channel }) => channel.close()));
    await publishChannel.close();
    await connection.close();
  };

  return { publish, subscribe, stopConsuming, close };
};
