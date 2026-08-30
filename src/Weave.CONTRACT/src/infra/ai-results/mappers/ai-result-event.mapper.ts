import { BaseMessageMapper } from '../../../common/mappers/base-message.mapper.js';
import type { AiResultEvent } from '../types/ai-result-event.type.js';
import { aiResultEventSchema } from '../validators/ai-result-event.schema.js';

export class AiResultEventMapper extends BaseMessageMapper<AiResultEvent> {
  public constructor() {
    super(aiResultEventSchema);
  }
}

export const aiResultEventMapper = new AiResultEventMapper();
