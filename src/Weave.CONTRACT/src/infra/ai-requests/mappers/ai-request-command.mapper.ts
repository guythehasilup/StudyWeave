import { BaseMessageMapper } from '../../../common/mappers/base-message.mapper.js';
import type { AiRequestCommand } from '../types/ai-request-command.type.js';
import { aiRequestCommandSchema } from '../validators/ai-request-command.schema.js';

export class AiRequestCommandMapper extends BaseMessageMapper<AiRequestCommand> {
  public constructor() {
    super(aiRequestCommandSchema);
  }

  public create(requestId: string): AiRequestCommand {
    return {
      version: 1,
      requestId,
    };
  }
}

export const aiRequestCommandMapper = new AiRequestCommandMapper();
