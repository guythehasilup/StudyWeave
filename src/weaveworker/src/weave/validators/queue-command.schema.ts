import { z } from 'zod';
import type { AiCancellationCommand, AiRequestCommand } from '../types/queue-command.type.js';

export const aiRequestCommandSchema: z.ZodType<AiRequestCommand> = z.object({
  version: z.literal(1),
  requestId: z.uuid(),
});

export const aiCancellationCommandSchema: z.ZodType<AiCancellationCommand> = z.object({
  version: z.literal(1),
  requestId: z.uuid(),
});
