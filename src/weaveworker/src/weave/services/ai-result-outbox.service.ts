import { AiResultOutbox } from '../../infra/ai-results/models/ai-result-outbox.model.js';
import type { AiResultOutboxDocument } from '../../infra/ai-results/types/ai-result-outbox.type.js';
import type { AiRequestDocument } from '../../infra/ai-requests/types/ai-request.type.js';
import type { OpenAiRequestResult } from '../types/openai-result.type.js';
import type { StageAiResultInput } from '../types/stage-ai-result-input.type.js';

export class AiResultOutboxService {
  public hasResult(requestId: string): Promise<boolean> {
    return AiResultOutbox.exists({ requestId, isDeleted: false }).then(Boolean);
  }

  public stageCompleted(
    request: AiRequestDocument,
    result: OpenAiRequestResult,
  ): Promise<AiResultOutboxDocument> {
    return this.stage({
      ...this.createBaseResult(request, 'completed'),
      responseText: result.responseText,
      providerResponseId: result.providerResponseId,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      failureCode: null,
    });
  }

  public stageFailure(
    request: AiRequestDocument,
    outcome: 'failed' | 'uncertain',
    failureCode: string,
  ): Promise<AiResultOutboxDocument> {
    return this.stage({
      ...this.createBaseResult(request, outcome),
      responseText: null,
      providerResponseId: null,
      inputTokens: null,
      outputTokens: null,
      failureCode,
    });
  }

  public stageCancellation(request: AiRequestDocument): Promise<AiResultOutboxDocument> {
    return this.stage({
      ...this.createBaseResult(request, 'cancelled'),
      responseText: null,
      providerResponseId: null,
      inputTokens: null,
      outputTokens: null,
      failureCode: null,
    });
  }

  private createBaseResult(
    request: AiRequestDocument,
    outcome: StageAiResultInput['outcome'],
  ): Omit<
    StageAiResultInput,
    'responseText' | 'providerResponseId' | 'inputTokens' | 'outputTokens' | 'failureCode'
  > {
    if (!request.workerId) {
      throw new Error('An AI result cannot be staged without a worker owner.');
    }

    return {
      requestId: request.id,
      workerId: request.workerId,
      workerAttempt: request.workerAttempt,
      outcome,
      completedAt: new Date(),
    };
  }

  private stage(input: StageAiResultInput): Promise<AiResultOutboxDocument> {
    return AiResultOutbox.findOneAndUpdate(
      { requestId: input.requestId, isDeleted: false },
      {
        $setOnInsert: input,
      },
      {
        upsert: true,
        setDefaultsOnInsert: true,
        returnDocument: 'after',
      },
    ).exec();
  }
}

export const aiResultOutboxService = new AiResultOutboxService();
