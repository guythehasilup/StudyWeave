import { BaseMessageMapper } from '../../../common/mappers/base-message.mapper.js';
import type { AiCancellationCommand } from '../types/ai-cancellation-command.type.js';
import { aiCancellationCommandSchema } from '../validators/ai-cancellation-command.schema.js';

export class AiCancellationCommandMapper extends BaseMessageMapper<AiCancellationCommand> {
  public constructor() {
    super(aiCancellationCommandSchema);
  }

  public create(requestId: string): AiCancellationCommand {
    return {
      version: 1,
      requestId,
    };
  }
}

export const aiCancellationCommandMapper = new AiCancellationCommandMapper();
