import { appConfig } from '../../common/config/app.config.js';
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
    for (let index = 0; index < publishBatchSize; index += 1) {
      const request = await this.claimRequestForPublishing();

      if (!request) {
        return;
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
          'studyweave.ai.request.v1',
        );
        await this.markRequestPublished(request.id);
        this.brokerFailureLogged = false;
      } catch (error: unknown) {
        await this.releaseRequestPublishClaim(request.id);
        throw error;
      }
    }
  }

  private async publishPendingCancellations(): Promise<void> {
    for (let index = 0; index < publishBatchSize; index += 1) {
      const request = await this.claimCancellationForPublishing();

      if (!request) {
        return;
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
          'studyweave.ai.cancellation.v1',
        );
        await AiRequest.updateOne(
          {
            id: request.id,
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
        this.brokerFailureLogged = false;
      } catch (error: unknown) {
        await AiRequest.updateOne(
          {
            id: request.id,
            cancelPublishState: 'publishing',
          },
          {
            $set: {
              cancelPublishState: 'pending',
              cancelPublishLeaseUntil: null,
            },
          },
        ).exec();
        throw error;
      }
    }
  }

  private claimRequestForPublishing(): Promise<AiRequestDocument | null> {
    const now = new Date();

    const leaseUntil = new Date(Date.now() + appConfig.AI_REQUEST_PUBLISH_LEASE_MS);

    return AiRequest.findOneAndUpdate(
      {
        status: 'pending',
        isDeleted: false,
        $or: [
          { queuePublishState: 'pending' },
          {
            queuePublishState: 'publishing',
            queuePublishLeaseUntil: { $lte: now },
          },
        ],
      },
      {
        $set: {
          queuePublishState: 'publishing',
          queuePublishLeaseUntil: leaseUntil,
        },
        $inc: {
          queuePublishAttempts: 1,
        },
      },
      {
        returnDocument: 'after',
        sort: { createdAt: 1 },
      },
    ).exec();
  }

  private claimCancellationForPublishing(): Promise<AiRequestDocument | null> {
    const now = new Date();

    const leaseUntil = new Date(Date.now() + appConfig.AI_REQUEST_PUBLISH_LEASE_MS);

    return AiRequest.findOneAndUpdate(
      {
        status: 'cancel_requested',
        isDeleted: false,
        $or: [
          { cancelPublishState: 'pending' },
          {
            cancelPublishState: 'publishing',
            cancelPublishLeaseUntil: { $lte: now },
          },
        ],
      },
      {
        $set: {
          cancelPublishState: 'publishing',
          cancelPublishLeaseUntil: leaseUntil,
        },
      },
      {
        returnDocument: 'after',
        sort: { cancelRequestedAt: 1 },
      },
    ).exec();
  }

  private async markRequestPublished(requestId: string): Promise<void> {
    const result = await AiRequest.updateOne(
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

    if (result.modifiedCount > 0) {
      return;
    }

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
}

export const aiRequestPublisherService = new AiRequestPublisherService();
