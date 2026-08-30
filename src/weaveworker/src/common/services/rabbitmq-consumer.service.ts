import {
  aiCancellationCommandMapper,
  aiRequestCommandMapper,
  mqEndpoints,
} from '@studyweave/weave-contract';
import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { appConfig } from '../config/app.config.js';
import { rabbitMqQuarantinePublisherService } from './rabbitmq-quarantine-publisher.service.js';
import type {
  CancellationMessageHandler,
  QueueMessageHandler,
} from '../../weave/types/queue-message-handler.type.js';

export class RabbitMqConsumerService {
  private connection: ChannelModel | null = null;
  private workChannel: Channel | null = null;
  private cancellationChannel: Channel | null = null;
  private workConsumerTag: string | null = null;
  private cancellationConsumerTag: string | null = null;
  private readonly activeWorkHandlers = new Set<Promise<void>>();
  private readonly activeCancellationHandlers = new Set<Promise<void>>();
  private closing = false;

  public async run(
    workHandler: QueueMessageHandler,
    cancellationHandler: CancellationMessageHandler,
  ): Promise<void> {
    if (this.closing) {
      return;
    }

    const connection = await amqp.connect(appConfig.RABBITMQ_URL);

    const connectionClosed = new Promise<void>((resolve) => {
      connection.once('close', resolve);
    });

    connection.on('error', () => undefined);

    let workChannel: Channel | null = null;

    let cancellationChannel: Channel | null = null;

    try {
      workChannel = await connection.createChannel();
      cancellationChannel = await connection.createChannel();

      const activeWorkChannel = workChannel;

      const activeCancellationChannel = cancellationChannel;

      if (this.closing) {
        await this.closeRunConnection(connection, activeWorkChannel, activeCancellationChannel);
        return;
      }

      this.connection = connection;
      this.workChannel = activeWorkChannel;
      this.cancellationChannel = activeCancellationChannel;

      await activeWorkChannel.assertQueue(
        mqEndpoints.aiRequests.queue,
        mqEndpoints.aiRequests.queueOptions,
      );
      await activeWorkChannel.prefetch(appConfig.WEAVE_WORKER_CONCURRENCY);

      await activeCancellationChannel.assertExchange(
        mqEndpoints.aiCancellations.exchange,
        mqEndpoints.aiCancellations.exchangeType,
        mqEndpoints.aiCancellations.exchangeOptions,
      );

      const cancellationQueue = await activeCancellationChannel.assertQueue('', {
        exclusive: true,
        autoDelete: true,
        durable: false,
      });

      await activeCancellationChannel.bindQueue(
        cancellationQueue.queue,
        mqEndpoints.aiCancellations.exchange,
        '',
      );

      if (this.closing) {
        await this.closeRunConnection(connection, activeWorkChannel, activeCancellationChannel);
        return;
      }

      const cancellationConsumer = await activeCancellationChannel.consume(
        cancellationQueue.queue,
        (message) => {
          if (message) {
            const handlerPromise = this.handleCancellationMessage(message, cancellationHandler);

            this.activeCancellationHandlers.add(handlerPromise);
            void handlerPromise.finally(() => {
              this.activeCancellationHandlers.delete(handlerPromise);
            });
          }
        },
        { noAck: false },
      );

      const workConsumer = await activeWorkChannel.consume(
        mqEndpoints.aiRequests.queue,
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

      this.cancellationConsumerTag = cancellationConsumer.consumerTag;
      this.workConsumerTag = workConsumer.consumerTag;

      console.log('@ WeaveWorker connected to RabbitMQ and is waiting for AI requests.');

      await connectionClosed;
    } catch (error: unknown) {
      await this.closeRunConnection(connection, workChannel, cancellationChannel);
      throw error;
    } finally {
      if (this.connection === connection) {
        this.connection = null;
        this.workChannel = null;
        this.cancellationChannel = null;
        this.workConsumerTag = null;
        this.cancellationConsumerTag = null;
      }
    }
  }

  public async close(): Promise<void> {
    this.closing = true;
    await this.cancelConsumers();
    await Promise.allSettled([...this.activeWorkHandlers, ...this.activeCancellationHandlers]);
    await rabbitMqQuarantinePublisherService.close();

    const workChannel = this.workChannel;

    const cancellationChannel = this.cancellationChannel;

    const connection = this.connection;

    this.workChannel = null;
    this.cancellationChannel = null;
    this.connection = null;
    this.workConsumerTag = null;
    this.cancellationConsumerTag = null;

    if (workChannel) {
      await workChannel.close().catch(() => undefined);
    }

    if (cancellationChannel) {
      await cancellationChannel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
    }
  }

  private async handleWorkMessage(
    message: ConsumeMessage,
    handler: QueueMessageHandler,
  ): Promise<void> {
    const channel = this.workChannel;

    if (!channel) {
      return;
    }

    if (message.properties.type !== mqEndpoints.aiRequests.messageType) {
      await this.quarantineMessage(channel, message, 'invalid_request_message_type');
      return;
    }

    const command = aiRequestCommandMapper.fromBuffer(message.content);

    if (!command) {
      await this.quarantineMessage(channel, message, 'invalid_request_body');
      return;
    }

    try {
      const disposition = await handler(command);

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

    if (message.properties.type !== mqEndpoints.aiCancellations.messageType) {
      await this.quarantineMessage(channel, message, 'invalid_cancellation_message_type');
      return;
    }

    const command = aiCancellationCommandMapper.fromBuffer(message.content);

    if (!command) {
      await this.quarantineMessage(channel, message, 'invalid_cancellation_body');
      return;
    }

    try {
      await handler(command);
      this.acknowledgeMessage(channel, message);
    } catch {
      console.error('# WeaveWorker could not process a cancellation signal; delivery will retry.');
      this.rejectMessage(channel, message);
    }
  }

  private async quarantineMessage(
    channel: Channel,
    message: ConsumeMessage,
    reason: string,
  ): Promise<void> {
    try {
      await rabbitMqQuarantinePublisherService.publish(message, reason);
      this.acknowledgeMessage(channel, message);

      console.error('# WeaveWorker quarantined an invalid RabbitMQ message.', { reason });
    } catch {
      console.error('# WeaveWorker could not quarantine an invalid message; delivery will retry.');
      this.rejectMessage(channel, message);
    }
  }

  private async cancelConsumers(): Promise<void> {
    const workChannel = this.workChannel;

    const workConsumerTag = this.workConsumerTag;

    const cancellationChannel = this.cancellationChannel;

    const cancellationConsumerTag = this.cancellationConsumerTag;

    this.workConsumerTag = null;
    this.cancellationConsumerTag = null;

    if (workChannel && workConsumerTag) {
      await workChannel.cancel(workConsumerTag).catch(() => undefined);
    }

    if (cancellationChannel && cancellationConsumerTag) {
      await cancellationChannel.cancel(cancellationConsumerTag).catch(() => undefined);
    }
  }

  private async closeRunConnection(
    connection: ChannelModel,
    workChannel: Channel | null,
    cancellationChannel: Channel | null,
  ): Promise<void> {
    if (this.connection === connection) {
      this.connection = null;
      this.workChannel = null;
      this.cancellationChannel = null;
      this.workConsumerTag = null;
      this.cancellationConsumerTag = null;
    }

    if (workChannel) {
      await workChannel.close().catch(() => undefined);
    }

    if (cancellationChannel) {
      await cancellationChannel.close().catch(() => undefined);
    }

    await connection.close().catch(() => undefined);
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
