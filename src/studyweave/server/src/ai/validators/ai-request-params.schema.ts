import { z } from 'zod';
import { he } from '../../common/resources/he.resource.js';
import type { AiRequestParams } from '../types/ai-request-params.type.js';

export const aiRequestParamsSchema: z.ZodType<AiRequestParams> = z.object({
  requestId: z.uuid(he.validation.aiRequestIdInvalid),
});
