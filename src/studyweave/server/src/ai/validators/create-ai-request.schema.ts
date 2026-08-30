import { z } from 'zod';
import { he } from '../../common/resources/he.resource.js';
import type { CreateAiRequestInput } from '../types/create-ai-request-input.type.js';

export const createAiRequestSchema: z.ZodType<CreateAiRequestInput> = z.object({
  clientRequestId: z.uuid(he.validation.aiRequestIdInvalid),
  message: z
    .string(he.validation.aiMessageRequired)
    .trim()
    .min(1, he.validation.aiMessageRequired)
    .max(8_000, he.validation.aiMessageLength),
});
