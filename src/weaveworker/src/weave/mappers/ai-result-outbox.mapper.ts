import type { AiResultEvent } from '@studyweave/weave-contract';
import { BaseEventMapper } from '../../common/mappers/base-event.mapper.js';
import type { AiResultOutboxDocument } from '../../infra/ai-results/types/ai-result-outbox.type.js';

export class AiResultOutboxMapper extends BaseEventMapper<AiResultOutboxDocument, AiResultEvent> {
  public toEvent(result: AiResultOutboxDocument): AiResultEvent {
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

export const aiResultOutboxMapper = new AiResultOutboxMapper();
