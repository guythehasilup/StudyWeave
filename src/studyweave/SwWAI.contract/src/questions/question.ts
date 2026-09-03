import { z } from 'zod';

export const QUESTION_STATUSES = {
  queued: 'queued',
  processing: 'processing',
  cancellationRequested: 'cancellation_requested',
  completed: 'completed',
  failed: 'failed',
  cancelled: 'cancelled',
} as const;

/**
 * Stable lifecycle state persisted for an asynchronous question.
 *
 * @example
 * const status: QuestionStatus = QUESTION_STATUSES.processing;
 */
export type QuestionStatus = (typeof QUESTION_STATUSES)[keyof typeof QUESTION_STATUSES];

/** Validate a serialized question lifecycle state. */
export const questionStatusSchema = z.enum(QUESTION_STATUSES);

/**
 * Represent one text input part in a question.
 *
 * @example
 * const part: TextQuestionContentPart = { type: 'text', text: 'What is inertia?' };
 */
export type TextQuestionContentPart = Readonly<{
  type: 'text';
  text: string;
}>;

/** Validate the text content supported by the current POC. */
export const textQuestionContentPartSchema: z.ZodType<TextQuestionContentPart> = z
  .object({
    type: z.literal('text'),
    text: z.string().trim().min(1).max(20_000),
  })
  .readonly();

/**
 * Enumerate content parts accepted by the current contract.
 *
 * This union is intentionally discriminated so image input can be added without
 * changing the surrounding question and message envelopes.
 *
 * @example
 * const part: QuestionContentPart = { type: 'text', text: 'Explain this proof.' };
 */
export type QuestionContentPart = TextQuestionContentPart;

/** Validate one supported question content part. */
export const questionContentPartSchema: z.ZodType<QuestionContentPart> =
  textQuestionContentPartSchema;

/**
 * Describe ordered, immutable user input sent for an AI answer.
 *
 * @example
 * const content: QuestionContent = { parts: [{ type: 'text', text: 'Why is the sky blue?' }] };
 */
export type QuestionContent = Readonly<{
  parts: readonly QuestionContentPart[];
}>;

/** Validate non-empty question content at HTTP and message boundaries. */
export const questionContentSchema: z.ZodType<QuestionContent> = z
  .object({
    parts: z.array(questionContentPartSchema).min(1).max(20).readonly(),
  })
  .readonly();

/**
 * Describe a question returned to its authenticated owner.
 *
 * @example
 * const question: QuestionDto = {
 *   id,
 *   content,
 *   status: 'queued',
 *   answer: null,
 *   errorCode: null,
 *   createdAt,
 *   updatedAt,
 * };
 */
export type QuestionDto = Readonly<{
  id: string;
  content: QuestionContent;
  status: QuestionStatus;
  answer: string | null;
  errorCode: string | null;
  createdAt: string;
  updatedAt: string;
}>;

/** Validate a client-safe question DTO at a JSON boundary. */
export const questionDtoSchema: z.ZodType<QuestionDto> = z
  .object({
    id: z.string().uuid(),
    content: questionContentSchema,
    status: questionStatusSchema,
    answer: z.string().nullable(),
    errorCode: z.string().nullable(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .readonly();

/**
 * Determine whether a question can still transition due to worker activity.
 *
 * @param status - Current persisted question status.
 * @returns `true` while processing or cancellation remains in flight.
 * @example
 * const isActive = isActiveQuestionStatus('queued'); // true
 */
export const isActiveQuestionStatus = (status: QuestionStatus): boolean =>
  status === QUESTION_STATUSES.queued ||
  status === QUESTION_STATUSES.processing ||
  status === QUESTION_STATUSES.cancellationRequested;

/**
 * Determine whether polling can stop for a question.
 *
 * @param status - Current persisted question status.
 * @returns `true` after completion, failure, or cancellation.
 * @example
 * const isTerminal = isTerminalQuestionStatus('completed'); // true
 */
export const isTerminalQuestionStatus = (status: QuestionStatus): boolean =>
  status === QUESTION_STATUSES.completed ||
  status === QUESTION_STATUSES.failed ||
  status === QUESTION_STATUSES.cancelled;
