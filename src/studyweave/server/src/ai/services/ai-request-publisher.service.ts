import type { QueryFilter, UpdateQuery } from 'mongoose';
import { appConfig } from '../../common/config/app.config.js';
import { mqEndpoints } from '../../common/messaging/mq-endpoints.js';
import { rabbitMqPublisherService } from '../../common/services/rabbitmq-publisher.service.js';
import { AiRequest } from '../../infra/ai-requests/models/ai-request.model.js';
import type { AiRequestDocument } from '../../infra/ai-requests/types/ai-request.type.js';
import type { AiCancellationCommand, AiRequestCommand } from '../types/ai-request-command.type.js';

const publishBatchSize = 25;

export class AiRequestPublisherService {
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

    await rabbitMqPublisherService.close();
  }

  private schedule(delay: number): void {
    this.timer = setTimeout(() => {
      this.timer = null;
      this.cyclePromise = this.runCycle();
      void this.cyclePromise.finally(() => {
        this.cyclePromise = null;
      });
    }, delay);
  }

  private async runCycle(): Promise<void> {
    try {
      await this.publishPendingRequests();
      await this.publishPendingCancellations();
    } catch {
      if (!this.brokerFailureLogged) {
        console.error('# RabbitMQ is unavailable; accepted AI requests remain pending in MongoDB.');
        this.brokerFailureLogged = true;
      }
    } finally {
      if (this.running) {
        this.schedule(appConfig.AI_REQUEST_PUBLISH_INTERVAL_MS);
      }
    }
  }

  private async publishPendingRequests(): Promise<void> {
    await this.publishBatch(() => this.publishNextRequest());
  }

  private async publishPendingCancellations(): Promise<void> {
    await this.publishBatch(() => this.publishNextCancellation());
  }

  private async publishBatch(publishNext: () => Promise<boolean>): Promise<void> {
    for (let index = 0; index < publishBatchSize; index += 1) {
      const published = await publishNext();

      if (!published) {
        return;
      }
    }
  }

  private async publishNextRequest(): Promise<boolean> {
    const request = await this.claimRequestForPublishing();

    if (!request) {
      return false;
    }

    try {
      const command: AiRequestCommand = {
        version: 1,
        requestId: request.id,
      };

      const content = Buffer.from(JSON.stringify(command), 'utf8');

      await rabbitMqPublisherService.publishToRequestQueue(
        content,
        request.id,
        mqEndpoints.aiRequests.messageType,
      );
      await this.markRequestPublished(request.id);
      this.brokerFailureLogged = false;

      return true;
    } catch (error: unknown) {
      await this.releaseRequestPublishClaim(request.id);
      throw error;
    }
  }

  private async publishNextCancellation(): Promise<boolean> {
    const request = await this.claimCancellationForPublishing();

    if (!request) {
      return false;
    }

    try {
      const command: AiCancellationCommand = {
        version: 1,
        requestId: request.id,
      };

      const content = Buffer.from(JSON.stringify(command), 'utf8');

      await rabbitMqPublisherService.publishCancellation(
        content,
        request.id,
        mqEndpoints.aiCancellations.messageType,
      );
      await this.markCancellationPublished(request.id);
      this.brokerFailureLogged = false;

      return true;
    } catch (error: unknown) {
      await this.releaseCancellationPublishClaim(request.id);
      throw error;
    }
  }

  private claimRequestForPublishing(): Promise<AiRequestDocument | null> {
    const now = new Date();

    const leaseUntil = new Date(Date.now() + appConfig.AI_REQUEST_PUBLISH_LEASE_MS);

    const availableRequestFilter: QueryFilter<AiRequestDocument> = {
      status: 'pending',
      isDeleted: false,
      $or: [
        { queuePublishState: 'pending' },
        {
          queuePublishState: 'publishing',
          queuePublishLeaseUntil: { $lte: now },
        },
      ],
    };

    const claimUpdate: UpdateQuery<AiRequestDocument> = {
      $set: {
        queuePublishState: 'publishing',
        queuePublishLeaseUntil: leaseUntil,
      },
      $inc: {
        queuePublishAttempts: 1,
      },
    };

    return AiRequest.findOneAndUpdate(availableRequestFilter, claimUpdate, {
      returnDocument: 'after',
      sort: { createdAt: 1 },
    }).exec();
  }

  private claimCancellationForPublishing(): Promise<AiRequestDocument | null> {
    const now = new Date();

    const leaseUntil = new Date(Date.now() + appConfig.AI_REQUEST_PUBLISH_LEASE_MS);

    const availableCancellationFilter: QueryFilter<AiRequestDocument> = {
      status: 'cancel_requested',
      isDeleted: false,
      $or: [
        { cancelPublishState: 'pending' },
        {
          cancelPublishState: 'publishing',
          cancelPublishLeaseUntil: { $lte: now },
        },
      ],
    };

    const claimUpdate: UpdateQuery<AiRequestDocument> = {
      $set: {
        cancelPublishState: 'publishing',
        cancelPublishLeaseUntil: leaseUntil,
      },
    };

    return AiRequest.findOneAndUpdate(availableCancellationFilter, claimUpdate, {
      returnDocument: 'after',
      sort: { cancelRequestedAt: 1 },
    }).exec();
  }

  private async markRequestPublished(requestId: string): Promise<void> {
    const queuedResult = await AiRequest.updateOne(
      {
        id: requestId,
        status: 'pending',
        queuePublishState: 'publishing',
      },
      {
        $set: {
          status: 'queued',
          queuePublishState: 'published',
          queuePublishLeaseUntil: null,
        },
      },
    ).exec();

    if (queuedResult.modifiedCount > 0) {
      return;
    }

    await this.markRequestPublishedAfterConcurrentCancellation(requestId);
  }

  private async markRequestPublishedAfterConcurrentCancellation(requestId: string): Promise<void> {
    await AiRequest.updateOne(
      {
        id: requestId,
        queuePublishState: 'publishing',
      },
      {
        $set: {
          queuePublishState: 'published',
          queuePublishLeaseUntil: null,
        },
      },
    ).exec();
  }

  private async markCancellationPublished(requestId: string): Promise<void> {
    await AiRequest.updateOne(
      {
        id: requestId,
        cancelPublishState: 'publishing',
      },
      {
        $set: {
          cancelPublishState: 'published',
          cancelPublishLeaseUntil: null,
          cancelPublishedAt: new Date(),
        },
      },
    ).exec();
  }

  private async releaseRequestPublishClaim(requestId: string): Promise<void> {
    await AiRequest.updateOne(
      {
        id: requestId,
        status: 'pending',
        queuePublishState: 'publishing',
      },
      {
        $set: {
          queuePublishState: 'pending',
          queuePublishLeaseUntil: null,
        },
      },
    ).exec();
  }

  private async releaseCancellationPublishClaim(requestId: string): Promise<void> {
    await AiRequest.updateOne(
      {
        id: requestId,
        cancelPublishState: 'publishing',
      },
      {
        $set: {
          cancelPublishState: 'pending',
          cancelPublishLeaseUntil: null,
        },
      },
    ).exec();
  }
}

export const aiRequestPublisherService = new AiRequestPublisherService();
