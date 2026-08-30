import { once } from 'node:events';
import { aiResultEventMapper, mqEndpoints, type AiResultEvent } from '@studyweave/weave-contract';
import amqp, { type ChannelModel, type ConfirmChannel } from 'amqplib';
import { appConfig } from '../config/app.config.js';

export class RabbitMqResultPublisherService {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private connectionPromise: Promise<ConfirmChannel> | null = null;

  public async publishResult(event: AiResultEvent): Promise<void> {
    try {
      const channel = await this.getChannel();

      const content = aiResultEventMapper.toBuffer(event);

      const accepted = channel.sendToQueue(mqEndpoints.aiResults.queue, content, {
        persistent: true,
        contentType: 'application/json',
        contentEncoding: 'utf-8',
        messageId: event.eventId,
        type: mqEndpoints.aiResults.messageType,
        timestamp: Date.now(),
      });

      if (!accepted) {
        await once(channel, 'drain');
      }

      await channel.waitForConfirms();
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

    await channel.assertQueue(mqEndpoints.aiResults.queue, mqEndpoints.aiResults.queueOptions);

    this.connection = connection;
    this.channel = channel;

    return channel;
  }
}

export const rabbitMqResultPublisherService = new RabbitMqResultPublisherService();
