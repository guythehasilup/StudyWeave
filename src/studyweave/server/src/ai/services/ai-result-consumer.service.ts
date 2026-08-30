import { aiResultEventMapper, mqEndpoints } from '@studyweave/weave-contract';
import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { appConfig } from '../../common/config/app.config.js';
import { rabbitMqQuarantinePublisherService } from '../../common/services/rabbitmq-quarantine-publisher.service.js';
import { aiResultLogic } from '../ai-result.logic.js';

export class AiResultConsumerService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private consumerTag: string | null = null;
  private loopPromise: Promise<void> | null = null;
  private readonly activeHandlers = new Set<Promise<void>>();
  private running = false;
  private brokerFailureLogged = false;

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.loopPromise = this.runLoop();
  }

  public async stop(): Promise<void> {
    this.running = false;
    await this.cancelConsumer();
    await Promise.allSettled(this.activeHandlers);
    await rabbitMqQuarantinePublisherService.close();
    await this.closeConnection();

    if (this.loopPromise) {
      await this.loopPromise;
      this.loopPromise = null;
    }
  }

  private async runLoop(): Promise<void> {
    while (this.running) {
      try {
        await this.consumeResults();
        this.brokerFailureLogged = false;
      } catch {
        if (!this.brokerFailureLogged) {
          console.error('# StudyWeave cannot consume AI results; RabbitMQ will be retried.');
          this.brokerFailureLogged = true;
        }
      }

      if (this.running) {
        await this.waitBeforeReconnect();
      }
    }
  }

  private async consumeResults(): Promise<void> {
    const connection = await amqp.connect(appConfig.RABBITMQ_URL);

    const connectionClosed = new Promise<void>((resolve) => {
      connection.once('close', resolve);
    });

    connection.on('error', () => undefined);

    try {
      const channel = await connection.createChannel();

      if (!this.running) {
        await channel.close().catch(() => undefined);
        await connection.close().catch(() => undefined);
        return;
      }

      this.connection = connection;
      this.channel = channel;

      await channel.assertQueue(mqEndpoints.aiResults.queue, mqEndpoints.aiResults.queueOptions);
      await channel.prefetch(10);

      if (!this.running) {
        await this.closeConnection();
        return;
      }

      const consumer = await channel.consume(
        mqEndpoints.aiResults.queue,
        (message) => {
          if (message) {
            const handlerPromise = this.handleResultMessage(message, channel);

            this.activeHandlers.add(handlerPromise);
            void handlerPromise.finally(() => {
              this.activeHandlers.delete(handlerPromise);
            });
          }
        },
        { noAck: false },
      );

      this.consumerTag = consumer.consumerTag;

      console.log('@ StudyWeave is consuming WeaveWorker results.');

      await connectionClosed;
    } catch (error: unknown) {
      if (this.connection === connection) {
        await this.closeConnection();
      } else {
        await connection.close().catch(() => undefined);
      }

      throw error;
    } finally {
      if (this.connection === connection) {
        this.connection = null;
        this.channel = null;
        this.consumerTag = null;
      }
    }
  }

  private async handleResultMessage(message: ConsumeMessage, channel: Channel): Promise<void> {
    if (message.properties.type !== mqEndpoints.aiResults.messageType) {
      await this.quarantineMessage(channel, message, 'invalid_result_message_type');
      return;
    }

    const event = aiResultEventMapper.fromBuffer(message.content);

    if (!event) {
      await this.quarantineMessage(channel, message, 'invalid_result_body');
      return;
    }

    try {
      await aiResultLogic.apply(event);
      this.acknowledgeMessage(channel, message);
    } catch {
      console.error('# StudyWeave could not persist an AI result; delivery will be retried.');
      this.rejectMessage(channel, message);
    }
  }

  private async closeConnection(): Promise<void> {
    const channel = this.channel;

    const connection = this.connection;

    this.channel = null;
    this.connection = null;
    this.consumerTag = null;

    if (channel) {
      await channel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
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

      console.error('# StudyWeave quarantined an invalid AI result message.', { reason });
    } catch {
      console.error('# StudyWeave could not quarantine an invalid result; delivery will retry.');
      this.rejectMessage(channel, message);
    }
  }

  private async cancelConsumer(): Promise<void> {
    const channel = this.channel;

    const consumerTag = this.consumerTag;

    this.consumerTag = null;

    if (channel && consumerTag) {
      await channel.cancel(consumerTag).catch(() => undefined);
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

  private async waitBeforeReconnect(): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, appConfig.RABBITMQ_RECONNECT_DELAY_MS);
    });
  }
}

export const aiResultConsumerService = new AiResultConsumerService();
