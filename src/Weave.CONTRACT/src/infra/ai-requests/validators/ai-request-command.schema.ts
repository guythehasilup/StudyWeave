import { z } from 'zod';
import type { AiRequestCommand } from '../types/ai-request-command.type.js';

export const aiRequestCommandSchema: z.ZodType<AiRequestCommand> = z.object({
  version: z.literal(1),
  requestId: z.uuid(),
});
