import { once } from 'node:events';
import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';
import { appConfig } from '../config/app.config.js';

export class RabbitMqPublisherService {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private connectionPromise: Promise<ConfirmChannel> | null = null;

  public async publishToRequestQueue(
    content: Buffer,
    messageId: string,
    messageType: string,
  ): Promise<void> {
    await this.publish(async (channel) => {
      const accepted = channel.sendToQueue(appConfig.AI_REQUEST_QUEUE, content, {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId,
        type: messageType,
        timestamp: Date.now(),
      });

      if (!accepted) {
        await once(channel, 'drain');
      }
    });
  }

  public async publishCancellation(
    content: Buffer,
    messageId: string,
    messageType: string,
  ): Promise<void> {
    await this.publish(async (channel) => {
      const accepted = channel.publish(appConfig.AI_CANCEL_EXCHANGE, '', content, {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId,
        type: messageType,
        timestamp: Date.now(),
      });

      if (!accepted) {
        await once(channel, 'drain');
      }
    });
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

  private async publish(action: (channel: ConfirmChannel) => Promise<void>): Promise<void> {
    try {
      const channel = await this.getChannel();

      await action(channel);
      await channel.waitForConfirms();
    } catch (error: unknown) {
      await this.close();
      throw error;
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

  private async connect(): Promise<ConfirmChannel> {
    const connection = await amqp.connect(appConfig.RABBITMQ_URL);

    const channel = await connection.createConfirmChannel();

    connection.on('error', () => undefined);
    connection.on('close', () => {
      if (this.connection === connection) {
        this.connection = null;
        this.channel = null;
      }
    });

    await channel.assertQueue(appConfig.AI_REQUEST_QUEUE, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });
    await channel.assertExchange(appConfig.AI_CANCEL_EXCHANGE, 'fanout', {
      durable: true,
    });

    this.connection = connection;
    this.channel = channel;

    return channel;
  }
}

export const rabbitMqPublisherService = new RabbitMqPublisherService();
