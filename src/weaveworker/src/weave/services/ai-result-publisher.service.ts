import type { QueryFilter, UpdateQuery } from 'mongoose';
import { appConfig } from '../../common/config/app.config.js';
import { rabbitMqResultPublisherService } from '../../common/services/rabbitmq-result-publisher.service.js';
import { AiResultOutbox } from '../../infra/ai-results/models/ai-result-outbox.model.js';
import type { AiResultOutboxDocument } from '../../infra/ai-results/types/ai-result-outbox.type.js';
import type { AiResultEvent } from '../types/ai-result-event.type.js';

const publishBatchSize = 25;

export class AiResultPublisherService {
  private timer: NodeJS.Timeout | null = null;
  private cyclePromise: Promise<void> | null = null;
  private running = false;
  private brokerFailureLogged = false;

  public start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.schedule(0);
  }

  public async stop(): Promise<void> {
    this.running = false;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.cyclePromise) {
      await this.cyclePromise;
    }

    await rabbitMqResultPublisherService.close();
  }

  private schedule(delay: number): void {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.cyclePromise = this.publishPendingResults();
      void this.cyclePromise.finally(() => {
        this.cyclePromise = null;
      });
    }, delay);
  }

  private async publishPendingResults(): Promise<void> {
    try {
      for (let index = 0; index < publishBatchSize; index += 1) {
        const published = await this.publishNextResult();

        if (!published) {
          return;
        }
      }
    } catch {
      if (!this.brokerFailureLogged) {
        console.error('# WeaveWorker cannot publish AI results; the outbox will retry.');
        this.brokerFailureLogged = true;
      }
    } finally {
      if (this.running) {
        this.schedule(appConfig.AI_RESULT_PUBLISH_INTERVAL_MS);
      }
    }
  }

  private async publishNextResult(): Promise<boolean> {
    const result = await this.claimResultForPublishing();

    if (!result) {
      return false;
    }

    try {
      await rabbitMqResultPublisherService.publishResult(this.toEvent(result));
      await this.markResultPublished(result.id);
      this.brokerFailureLogged = false;

      return true;
    } catch (error: unknown) {
      await this.releaseResultPublishClaim(result.id);
      throw error;
    }
  }

  private claimResultForPublishing(): Promise<AiResultOutboxDocument | null> {
    const now = new Date();

    const leaseUntil = new Date(Date.now() + appConfig.AI_RESULT_PUBLISH_LEASE_MS);

    const availableResultFilter: QueryFilter<AiResultOutboxDocument> = {
      isDeleted: false,
      $or: [
        { publishState: 'pending' },
        {
          publishState: 'publishing',
          publishLeaseUntil: { $lte: now },
        },
      ],
    };

    const claimUpdate: UpdateQuery<AiResultOutboxDocument> = {
      $set: {
        publishState: 'publishing',
        publishLeaseUntil: leaseUntil,
      },
      $inc: {
        publishAttempts: 1,
      },
    };

    return AiResultOutbox.findOneAndUpdate(availableResultFilter, claimUpdate, {
      returnDocument: 'after',
      sort: { createdAt: 1 },
    }).exec();
  }

  private async markResultPublished(eventId: string): Promise<void> {
    await AiResultOutbox.updateOne(
      {
        id: eventId,
        publishState: 'publishing',
      },
      {
        $set: {
          publishState: 'published',
          publishLeaseUntil: null,
          publishedAt: new Date(),
        },
      },
    ).exec();
  }

  private async releaseResultPublishClaim(eventId: string): Promise<void> {
    await AiResultOutbox.updateOne(
      {
        id: eventId,
        publishState: 'publishing',
      },
      {
        $set: {
          publishState: 'pending',
          publishLeaseUntil: null,
        },
      },
    ).exec();
  }

  private toEvent(result: AiResultOutboxDocument): AiResultEvent {
    return {
      version: 1,
      eventId: result.id,
      requestId: result.requestId,
      workerId: result.workerId,
      workerAttempt: result.workerAttempt,
      outcome: result.outcome,
      responseText: result.responseText,
      providerResponseId: result.providerResponseId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      failureCode: result.failureCode,
      completedAt: result.completedAt.toISOString(),
    };
  }
}

export const aiResultPublisherService = new AiResultPublisherService();
