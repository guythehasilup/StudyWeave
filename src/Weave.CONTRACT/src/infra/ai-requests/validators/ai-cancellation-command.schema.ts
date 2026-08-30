import { z } from 'zod';
import type { AiCancellationCommand } from '../types/ai-cancellation-command.type.js';

export const aiCancellationCommandSchema: z.ZodType<AiCancellationCommand> = z.object({
  version: z.literal(1),
  requestId: z.uuid(),
});
