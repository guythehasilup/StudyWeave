import { questionContentSchema } from '@studyweave/swwai-contract';
import { z } from 'zod';
import type { CreateQuestionInput, QuestionParams } from './question.service.js';

/** Validate extensible content submitted for a new question. */
export const createQuestionSchema: z.ZodType<CreateQuestionInput> = z
  .object({
    content: questionContentSchema,
  })
  .readonly();

/** Validate the UUID used by polling and cancellation routes. */
export const questionParamsSchema: z.ZodType<QuestionParams> = z
  .object({
    questionId: z.string().uuid(),
  })
  .readonly();
