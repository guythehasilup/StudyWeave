import { z } from 'zod';
import { aiResultOutcomes, type AiResultEvent } from '../types/ai-result-event.type.js';

export const aiResultEventSchema: z.ZodType<AiResultEvent> = z
  .object({
    version: z.literal(1),
    eventId: z.uuid(),
    requestId: z.uuid(),
    workerId: z.string().min(1).max(200),
    workerAttempt: z.number().int().positive(),
    outcome: z.enum(aiResultOutcomes),
    responseText: z.string().max(100_000).nullable(),
    providerResponseId: z.string().min(1).max(200).nullable(),
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
    failureCode: z.string().min(1).max(100).nullable(),
    completedAt: z.iso.datetime(),
  })
  .superRefine((event, context) => {
    if (event.outcome === 'completed' && event.responseText === null) {
      context.addIssue({
        code: 'custom',
        message: 'A completed AI result requires response text.',
        path: ['responseText'],
      });
    }

    if (event.outcome === 'completed' && event.providerResponseId === null) {
      context.addIssue({
        code: 'custom',
        message: 'A completed AI result requires a provider response identifier.',
        path: ['providerResponseId'],
      });
    }
  });
