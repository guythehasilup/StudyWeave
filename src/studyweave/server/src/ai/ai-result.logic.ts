import { BaseLogic } from '../common/logic/base.logic.js';
import { AiRequest } from '../infra/ai-requests/models/ai-request.model.js';
import type { AiRequestDocument } from '../infra/ai-requests/types/ai-request.type.js';
import type { AiResultEvent } from './types/ai-result-event.type.js';

export class AiResultLogic extends BaseLogic {
  public apply(event: AiResultEvent): Promise<void> {
    return this.execute(async () => {
      const request = await this.findRequest(event.requestId);

      if (!request || !this.isCurrentWorkerAttempt(request, event)) {
        return;
      }

      if (request.lastResultEventId === event.eventId || this.isTerminal(request.status)) {
        return;
      }

      if (event.outcome === 'cancelled' || request.cancelRequestedAt) {
        await this.applyCancellation(event);
        return;
      }

      const resultApplied = await this.applyProviderOutcome(event);

      if (!resultApplied) {
        await this.applyCancellation(event);
      }
    });
  }

  private findRequest(requestId: string): Promise<AiRequestDocument | null> {
    return AiRequest.findOne({ id: requestId, isDeleted: false }).exec();
  }

  private async applyProviderOutcome(event: AiResultEvent): Promise<boolean> {
    const update = this.createProviderOutcomeUpdate(event);

    const result = await AiRequest.updateOne(
      {
        id: event.requestId,
        workerId: event.workerId,
        workerAttempt: event.workerAttempt,
        status: 'processing',
        cancelRequestedAt: null,
        isDeleted: false,
      },
      { $set: update },
    ).exec();

    return result.modifiedCount > 0;
  }

  private async applyCancellation(event: AiResultEvent): Promise<void> {
    await AiRequest.updateOne(
      {
        id: event.requestId,
        workerId: event.workerId,
        workerAttempt: event.workerAttempt,
        status: { $in: ['processing', 'cancel_requested'] },
        isDeleted: false,
      },
      {
        $set: {
          status: 'cancelled',
          responseText: null,
          failureCode: null,
          providerResponseId: null,
          inputTokens: null,
          outputTokens: null,
          processingLeaseUntil: null,
          lastResultEventId: event.eventId,
          completedAt: new Date(event.completedAt),
        },
      },
    ).exec();
  }

  private createProviderOutcomeUpdate(event: AiResultEvent): Partial<AiRequestDocument> {
    return {
      status: event.outcome,
      responseText: event.responseText,
      failureCode: event.failureCode,
      providerResponseId: event.providerResponseId,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
      processingLeaseUntil: null,
      lastResultEventId: event.eventId,
      completedAt: new Date(event.completedAt),
    };
  }

  private isCurrentWorkerAttempt(request: AiRequestDocument, event: AiResultEvent): boolean {
    return request.workerId === event.workerId && request.workerAttempt === event.workerAttempt;
  }

  private isTerminal(status: AiRequestDocument['status']): boolean {
    return ['completed', 'failed', 'uncertain', 'cancelled'].includes(status);
  }
}

export const aiResultLogic = new AiResultLogic();
