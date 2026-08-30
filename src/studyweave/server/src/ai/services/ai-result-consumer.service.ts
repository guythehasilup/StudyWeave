import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import { appConfig } from '../../common/config/app.config.js';
import { mqEndpoints } from '../../common/messaging/mq-endpoints.js';
import { aiResultLogic } from '../ai-result.logic.js';
import { aiResultEventSchema } from '../validators/ai-result-event.schema.js';

export class AiResultConsumerService {
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
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
    await this.closeConnection();

    if (this.loopPromise) {
      await this.loopPromise;
      this.loopPromise = null;
    }

    await Promise.allSettled(this.activeHandlers);
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

    const channel = await connection.createChannel();

    connection.on('error', () => undefined);

    await channel.assertQueue(mqEndpoints.aiResults.queue, {
      durable: true,
      arguments: {
        'x-queue-type': 'quorum',
      },
    });
    await channel.prefetch(10);

    this.connection = connection;
    this.channel = channel;

    await channel.consume(
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

    console.log('@ StudyWeave is consuming WeaveWorker results.');

    await new Promise<void>((resolve) => {
      connection.once('close', resolve);
    });

    if (this.connection === connection) {
      this.connection = null;
      this.channel = null;
    }
  }

  private async handleResultMessage(message: ConsumeMessage, channel: Channel): Promise<void> {
    const event = aiResultEventSchema.safeParse(this.parseMessage(message.content));

    if (!event.success) {
      console.error('# StudyWeave discarded an invalid AI result event.');
      this.acknowledgeMessage(channel, message);
      return;
    }

    try {
      await aiResultLogic.apply(event.data);
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

    if (channel) {
      await channel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
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

  private parseMessage(content: Buffer): unknown {
    try {
      return JSON.parse(content.toString('utf8')) as unknown;
    } catch {
      return null;
    }
  }
}

export const aiResultConsumerService = new AiResultConsumerService();
