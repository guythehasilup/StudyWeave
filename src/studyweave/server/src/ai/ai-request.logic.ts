import { StatusCodes } from 'http-status-codes';
import { BaseLogic } from '../common/logic/base.logic.js';
import { he } from '../common/resources/he.resource.js';
import { AiRequest } from '../infra/ai-requests/models/ai-request.model.js';
import type { AiRequestDocument } from '../infra/ai-requests/types/ai-request.type.js';
import { AiRequestError } from './errors/ai-request.error.js';
import { aiRequestMapper } from './mappers/ai-request.mapper.js';
import type { AiRequestView } from './types/ai-request-view.type.js';
import type { CreateAiRequestInput } from './types/create-ai-request-input.type.js';
import type { CreateAiRequestResult } from './types/create-ai-request-result.type.js';

export class AiRequestLogic extends BaseLogic {
  public create(userId: string, input: CreateAiRequestInput): Promise<CreateAiRequestResult> {
    return this.execute(async () => {
      const existingRequest = await this.findByClientRequestId(userId, input.clientRequestId);

      if (existingRequest) {
        return this.mapExistingRequest(existingRequest, input.message);
      }

      try {
        const request = await this.createRequest(userId, input);

        return {
          created: true,
          request: aiRequestMapper.toViewModel(request),
        };
      } catch (error: unknown) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }

        const duplicateRequest = await this.findByClientRequestId(userId, input.clientRequestId);

        if (!duplicateRequest) {
          throw error;
        }

        return this.mapExistingRequest(duplicateRequest, input.message);
      }
    });
  }

  public getById(userId: string, requestId: string): Promise<AiRequestView> {
    return this.execute(async () => {
      const request = await this.findOwnedRequest(userId, requestId);

      return aiRequestMapper.toViewModel(request);
    });
  }

  public abort(userId: string, requestId: string): Promise<AiRequestView> {
    return this.execute(async () => {
      for (let attempt = 0; attempt < 3; attempt += 1) {
        const request = await this.findOwnedRequest(userId, requestId);

        if (this.isTerminal(request.status) || request.status === 'cancel_requested') {
          return aiRequestMapper.toViewModel(request);
        }

        if (request.status === 'pending' || request.status === 'queued') {
          const cancelledRequest = await this.cancelBeforeProcessing(request);

          if (cancelledRequest) {
            return aiRequestMapper.toViewModel(cancelledRequest);
          }

          continue;
        }

        if (request.status === 'processing') {
          const cancellingRequest = await this.requestProcessingCancellation(request);

          if (cancellingRequest) {
            return aiRequestMapper.toViewModel(cancellingRequest);
          }
        }
      }

      const latestRequest = await this.findOwnedRequest(userId, requestId);

      return aiRequestMapper.toViewModel(latestRequest);
    });
  }

  private createRequest(userId: string, input: CreateAiRequestInput): Promise<AiRequestDocument> {
    return AiRequest.create({
      userId,
      clientRequestId: input.clientRequestId,
      message: input.message,
    });
  }

  private findByClientRequestId(
    userId: string,
    clientRequestId: string,
  ): Promise<AiRequestDocument | null> {
    return AiRequest.findOne({
      userId,
      clientRequestId,
      isDeleted: false,
    }).exec();
  }

  private cancelBeforeProcessing(request: AiRequestDocument): Promise<AiRequestDocument | null> {
    const now = new Date();

    return AiRequest.findOneAndUpdate(
      {
        id: request.id,
        userId: request.userId,
        status: request.status,
        isDeleted: false,
      },
      {
        $set: {
          status: 'cancelled',
          cancelRequestedAt: now,
          completedAt: now,
        },
      },
      { returnDocument: 'after' },
    ).exec();
  }

  private requestProcessingCancellation(
    request: AiRequestDocument,
  ): Promise<AiRequestDocument | null> {
    return AiRequest.findOneAndUpdate(
      {
        id: request.id,
        userId: request.userId,
        status: 'processing',
        isDeleted: false,
      },
      {
        $set: {
          status: 'cancel_requested',
          cancelRequestedAt: new Date(),
          cancelPublishState: 'pending',
          cancelPublishLeaseUntil: null,
        },
      },
      { returnDocument: 'after' },
    ).exec();
  }

  private async findOwnedRequest(userId: string, requestId: string): Promise<AiRequestDocument> {
    const request = await AiRequest.findOne({
      id: requestId,
      userId,
      isDeleted: false,
    }).exec();

    if (!request) {
      throw new AiRequestError(StatusCodes.NOT_FOUND, he.ai.requestNotFound);
    }

    return request;
  }

  private mapExistingRequest(request: AiRequestDocument, message: string): CreateAiRequestResult {
    if (request.message !== message) {
      throw new AiRequestError(StatusCodes.CONFLICT, he.ai.clientRequestConflict);
    }

    return {
      created: false,
      request: aiRequestMapper.toViewModel(request),
    };
  }

  private isTerminal(status: AiRequestDocument['status']): boolean {
    return ['completed', 'failed', 'uncertain', 'cancelled'].includes(status);
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object' || !('code' in error)) {
      return false;
    }

    return error.code === 11_000;
  }
}

export const aiRequestLogic = new AiRequestLogic();
