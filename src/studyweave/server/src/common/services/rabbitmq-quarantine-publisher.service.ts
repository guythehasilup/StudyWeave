import { mqEndpoints } from '@studyweave/weave-contract';
import amqp, { type ChannelModel, type ConfirmChannel, type ConsumeMessage } from 'amqplib';
import { appConfig } from '../config/app.config.js';

export class RabbitMqQuarantinePublisherService {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private connectionPromise: Promise<ConfirmChannel> | null = null;

  public async publish(message: ConsumeMessage, reason: string): Promise<void> {
    try {
      const channel = await this.getChannel();

      let accepted = true;

      const confirmation = new Promise<void>((resolve, reject) => {
        accepted = channel.sendToQueue(
          mqEndpoints.quarantine.queue,
          message.content,
          {
            persistent: true,
            contentType: message.properties.contentType ?? 'application/json',
            contentEncoding: message.properties.contentEncoding ?? 'utf-8',
            correlationId: message.properties.correlationId,
            messageId: message.properties.messageId,
            type: mqEndpoints.quarantine.messageType,
            timestamp: Date.now(),
            headers: {
              ...(message.properties.headers ?? {}),
              'x-studyweave-quarantine-reason': reason,
              'x-studyweave-original-exchange': message.fields.exchange,
              'x-studyweave-original-message-type': message.properties.type ?? 'missing',
              'x-studyweave-original-routing-key': message.fields.routingKey,
            },
          },
          (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          },
        );
      });

      if (!accepted) {
        await Promise.all([confirmation, this.waitForDrain(channel)]);
        return;
      }

      await confirmation;
    } catch (error: unknown) {
      await this.close();
      throw error;
    }
  }

  public async close(): Promise<void> {
    const channel = this.channel;

    const connection = this.connection;

    this.channel = null;
    this.connection = null;
    this.connectionPromise = null;

    if (channel) {
      await channel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
    }
  }

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    if (!this.connectionPromise) {
      this.connectionPromise = this.connect();
    }

    try {
      return await this.connectionPromise;
    } finally {
      this.connectionPromise = null;
    }
  }

  private waitForDrain(channel: ConfirmChannel): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      function cleanup(): void {
        channel.off('drain', handleDrain);
        channel.off('close', handleClose);
      }

      function handleDrain(): void {
        cleanup();
        resolve();
      }

      function handleClose(): void {
        cleanup();
        reject(new Error('RabbitMQ quarantine channel closed before draining.'));
      }

      channel.once('drain', handleDrain);
      channel.once('close', handleClose);
    });
  }

  private async connect(): Promise<ConfirmChannel> {
    const connection = await amqp.connect(appConfig.RABBITMQ_URL);

    connection.on('error', () => undefined);
    connection.on('close', () => {
      if (this.connection === connection) {
        this.connection = null;
        this.channel = null;
      }
    });

    let channel: ConfirmChannel | null = null;

    try {
      channel = await connection.createConfirmChannel();

      await channel.assertQueue(mqEndpoints.quarantine.queue, mqEndpoints.quarantine.queueOptions);

      this.connection = connection;
      this.channel = channel;

      return channel;
    } catch (error: unknown) {
      if (channel) {
        await channel.close().catch(() => undefined);
      }

      await connection.close().catch(() => undefined);
      throw error;
    }
  }
}

export const rabbitMqQuarantinePublisherService = new RabbitMqQuarantinePublisherService();
