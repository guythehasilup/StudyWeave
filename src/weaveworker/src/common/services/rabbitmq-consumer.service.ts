import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { appConfig } from '../config/app.config.js';
import type {
  CancellationMessageHandler,
  QueueMessageHandler,
} from '../../weave/types/queue-message-handler.type.js';

export class RabbitMqConsumerService {
  private connection: ChannelModel | null = null;
  private workChannel: Channel | null = null;
  private cancellationChannel: Channel | null = null;
  private readonly activeWorkHandlers = new Set<Promise<void>>();

  public async run(
    workHandler: QueueMessageHandler,
    cancellationHandler: CancellationMessageHandler,
  ): Promise<void> {
    const connection = await amqp.connect(appConfig.RABBITMQ_URL);

    const workChannel = await connection.createChannel();

    const cancellationChannel = await connection.createChannel();

    connection.on('error', () => undefined);

    await workChannel.assertQueue(appConfig.AI_REQUEST_QUEUE, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });
    await workChannel.prefetch(appConfig.WEAVE_WORKER_CONCURRENCY);

    await cancellationChannel.assertExchange(appConfig.AI_CANCEL_EXCHANGE, 'fanout', {
      durable: true,
    });

    const cancellationQueue = await cancellationChannel.assertQueue('', {
      exclusive: true,
      autoDelete: true,
      durable: false,
    });

    await cancellationChannel.bindQueue(cancellationQueue.queue, appConfig.AI_CANCEL_EXCHANGE, '');

    this.connection = connection;
    this.workChannel = workChannel;
    this.cancellationChannel = cancellationChannel;

    await cancellationChannel.consume(
      cancellationQueue.queue,
      (message) => {
        if (message) {
          void this.handleCancellationMessage(message, cancellationHandler);
        }
      },
      { noAck: false },
    );
    await workChannel.consume(
      appConfig.AI_REQUEST_QUEUE,
      (message) => {
        if (message) {
          const handlerPromise = this.handleWorkMessage(message, workHandler);

          this.activeWorkHandlers.add(handlerPromise);
          void handlerPromise.finally(() => {
            this.activeWorkHandlers.delete(handlerPromise);
          });
        }
      },
      { noAck: false },
    );

    console.log('@ WeaveWorker connected to RabbitMQ and is waiting for AI requests.');

    await new Promise<void>((resolve) => {
      connection.once('close', resolve);
    });

    this.connection = null;
    this.workChannel = null;
    this.cancellationChannel = null;
  }

  public async close(): Promise<void> {
    const workChannel = this.workChannel;

    const cancellationChannel = this.cancellationChannel;

    const connection = this.connection;

    this.workChannel = null;
    this.cancellationChannel = null;
    this.connection = null;

    if (workChannel) {
      await workChannel.close().catch(() => undefined);
    }

    if (cancellationChannel) {
      await cancellationChannel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
    }

    await Promise.allSettled(this.activeWorkHandlers);
  }

  private async handleWorkMessage(
    message: ConsumeMessage,
    handler: QueueMessageHandler,
  ): Promise<void> {
    const channel = this.workChannel;

    if (!channel) {
      return;
    }

    try {
      const disposition = await handler(message.content);

      if (disposition === 'requeue') {
        this.rejectMessage(channel, message);
        return;
      }

      this.acknowledgeMessage(channel, message);
    } catch {
      console.error('# WeaveWorker failed before safely recording an AI request outcome.');
      this.rejectMessage(channel, message);
    }
  }

  private async handleCancellationMessage(
    message: ConsumeMessage,
    handler: CancellationMessageHandler,
  ): Promise<void> {
    const channel = this.cancellationChannel;

    if (!channel) {
      return;
    }

    try {
      await handler(message.content);
    } catch {
      console.error('# WeaveWorker could not process a cancellation signal.');
    } finally {
      this.acknowledgeMessage(channel, message);
    }
  }

  private acknowledgeMessage(channel: Channel, message: ConsumeMessage): void {
    try {
      channel.ack(message);
    } catch {
      return;
    }
  }

  private rejectMessage(channel: Channel, message: ConsumeMessage): void {
    try {
      channel.nack(message, false, true);
    } catch {
      return;
    }
  }
}

export const rabbitMqConsumerService = new RabbitMqConsumerService();
