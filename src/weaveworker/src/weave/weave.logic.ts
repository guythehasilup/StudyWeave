import { appConfig } from '../common/config/app.config.js';
import { BaseLogic } from '../common/logic/base.logic.js';
import { rabbitMqConsumerService } from '../common/services/rabbitmq-consumer.service.js';
import { AiRequest } from '../infra/ai-requests/models/ai-request.model.js';
import type { AiRequestDocument } from '../infra/ai-requests/types/ai-request.type.js';
import { aiResultOutboxService } from './services/ai-result-outbox.service.js';
import { cancellationRegistryService } from './services/cancellation-registry.service.js';
import { openAiService } from './services/openai.service.js';
import type { QueueMessageDisposition } from './types/queue-message-handler.type.js';
import {
  aiCancellationCommandSchema,
  aiRequestCommandSchema,
} from './validators/queue-command.schema.js';

export class WeaveLogic extends BaseLogic {
  public run(): Promise<void> {
    return this.execute(() =>
      rabbitMqConsumerService.run(this.handleRequestMessage, this.handleCancellationMessage),
    );
  }

  public async stop(): Promise<void> {
    cancellationRegistryService.abortAll();
    await rabbitMqConsumerService.close();
  }

  private readonly handleRequestMessage = async (
    content: Buffer,
  ): Promise<QueueMessageDisposition> => {
    const parsedCommand = aiRequestCommandSchema.safeParse(this.parseMessage(content));

    if (!parsedCommand.success) {
      console.error('# WeaveWorker discarded an invalid request command.');
      return 'ack';
    }

    const resultAlreadyStaged = await aiResultOutboxService.hasResult(parsedCommand.data.requestId);

    if (resultAlreadyStaged) {
      return 'ack';
    }

    const request = await this.claimRequest(parsedCommand.data.requestId);

    if (!request) {
      return this.resolveUnclaimedRequest(parsedCommand.data.requestId);
    }

    await this.processClaimedRequest(request);

    return 'ack';
  };

  private readonly handleCancellationMessage = async (content: Buffer): Promise<void> => {
    const parsedCommand = aiCancellationCommandSchema.safeParse(this.parseMessage(content));

    if (!parsedCommand.success) {
      console.error('# WeaveWorker discarded an invalid cancellation command.');
      return;
    }

    const aborted = cancellationRegistryService.abort(parsedCommand.data.requestId);

    if (aborted) {
      console.log('@ WeaveWorker interrupted an active AI request.', {
        requestId: parsedCommand.data.requestId,
      });
    }
  };

  private claimRequest(requestId: string): Promise<AiRequestDocument | null> {
    const now = new Date();

    const leaseUntil = this.createLease();

    return AiRequest.findOneAndUpdate(
      {
        id: requestId,
        isDeleted: false,
        cancelRequestedAt: null,
        $or: [
          { status: { $in: ['pending', 'queued'] } },
          {
            status: 'processing',
            processingLeaseUntil: { $lte: now },
            providerRequestStartedAt: null,
          },
        ],
      },
      {
        $set: {
          status: 'processing',
          workerId: appConfig.WEAVE_WORKER_ID,
          processingStartedAt: now,
          processingLeaseUntil: leaseUntil,
          failureCode: null,
        },
        $inc: {
          workerAttempt: 1,
        },
      },
      { returnDocument: 'after' },
    ).exec();
  }

  private async resolveUnclaimedRequest(requestId: string): Promise<QueueMessageDisposition> {
    const request = await AiRequest.findOne({
      id: requestId,
      isDeleted: false,
    }).exec();

    if (!request) {
      return 'ack';
    }

    if (request.status === 'cancel_requested') {
      await this.stageCancellation(request);
      return 'ack';
    }

    if (this.isTerminal(request.status)) {
      return 'ack';
    }

    if (request.status === 'processing') {
      const leaseExpired =
        request.processingLeaseUntil !== null && request.processingLeaseUntil <= new Date();

      if (leaseExpired && request.providerRequestStartedAt) {
        await this.stageRecoveredRequestUncertain(request);
        return 'ack';
      }

      await this.waitBeforeRequeue(request.processingLeaseUntil);
      return 'requeue';
    }

    return 'requeue';
  }

  private async processClaimedRequest(request: AiRequestDocument): Promise<void> {
    const controller = cancellationRegistryService.register(request.id);

    const heartbeat = setInterval(() => {
      void this.extendLease(request.id, controller);
    }, appConfig.WEAVE_WORKER_HEARTBEAT_MS);

    try {
      const providerStart = await AiRequest.updateOne(
        {
          id: request.id,
          workerId: appConfig.WEAVE_WORKER_ID,
          status: 'processing',
          cancelRequestedAt: null,
        },
        {
          $set: {
            providerRequestStartedAt: new Date(),
          },
        },
      ).exec();

      if (providerStart.modifiedCount === 0) {
        await this.stageCancellation(request);
        return;
      }

      if (controller.signal.aborted) {
        throw new Error('AI request execution was interrupted before the provider call.');
      }

      const result = await openAiService.createResponse(
        {
          requestId: request.id,
          userId: request.userId,
          message: request.message,
        },
        controller.signal,
      );

      const cancellationRequested = await this.isCancellationRequested(request.id);

      if (cancellationRequested) {
        await this.stageCancellation(request);
        return;
      }

      await aiResultOutboxService.stageCompleted(request, result);

      console.log('@ WeaveWorker staged an AI response for delivery.', { requestId: request.id });
    } catch (error: unknown) {
      await this.recordProviderFailure(request, error);
    } finally {
      clearInterval(heartbeat);
      cancellationRegistryService.remove(request.id);
    }
  }

  private async recordProviderFailure(request: AiRequestDocument, error: unknown): Promise<void> {
    const cancellationRequested = await this.isCancellationRequested(request.id);

    if (cancellationRequested) {
      await this.stageCancellation(request);
      return;
    }

    const disposition = openAiService.classifyFailure(error);

    let failureCode = 'provider_outcome_unknown';

    if (disposition === 'failed') {
      failureCode = 'provider_rejected_request';
    }

    await aiResultOutboxService.stageFailure(request, disposition, failureCode);

    console.error('# WeaveWorker staged a safe AI request failure.', {
      requestId: request.id,
      failureCode,
      providerStatus: openAiService.getStatus(error),
    });
  }

  private async extendLease(requestId: string, controller: AbortController): Promise<void> {
    try {
      const result = await AiRequest.updateOne(
        {
          id: requestId,
          workerId: appConfig.WEAVE_WORKER_ID,
          status: 'processing',
          cancelRequestedAt: null,
        },
        {
          $set: {
            processingLeaseUntil: this.createLease(),
          },
        },
      ).exec();

      if (result.modifiedCount === 0) {
        controller.abort();
      }
    } catch {
      console.error('# WeaveWorker could not renew an AI request lease.', { requestId });
      controller.abort();
    }
  }

  private async stageCancellation(request: AiRequestDocument): Promise<void> {
    await aiResultOutboxService.stageCancellation(request);
  }

  private async stageRecoveredRequestUncertain(request: AiRequestDocument): Promise<void> {
    await aiResultOutboxService.stageFailure(
      request,
      'uncertain',
      'worker_lost_after_provider_start',
    );
  }

  private async isCancellationRequested(requestId: string): Promise<boolean> {
    const request = await AiRequest.exists({
      id: requestId,
      cancelRequestedAt: { $ne: null },
      isDeleted: false,
    });

    return Boolean(request);
  }

  private createLease(): Date {
    return new Date(Date.now() + appConfig.WEAVE_WORKER_PROCESSING_LEASE_MS);
  }

  private isTerminal(status: AiRequestDocument['status']): boolean {
    return ['completed', 'failed', 'uncertain', 'cancelled'].includes(status);
  }

  private async waitBeforeRequeue(leaseUntil: Date | null): Promise<void> {
    let delay = 1_000;

    if (leaseUntil) {
      delay = Math.max(1_000, Math.min(5_000, leaseUntil.getTime() - Date.now()));
    }

    await new Promise<void>((resolve) => {
      setTimeout(resolve, delay);
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

export const weaveLogic = new WeaveLogic();
