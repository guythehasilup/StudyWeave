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
export interface TextQuestionContentPart {
  readonly type: 'text';
  readonly text: string;
}

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
export interface QuestionContent {
  readonly parts: readonly QuestionContentPart[];
}

/** Validate non-empty question content at HTTP and message boundaries. */
export const questionContentSchema: z.ZodType<QuestionContent> = z
  .object({
    parts: z.array(questionContentPartSchema).min(1).max(20).readonly(),
  })
  .readonly();

/**
 * Describe an AI response nested under its owner-authorized question.
 *
 * @example
 * const response: QuestionResponseDto = {
 *   id,
 *   answer: 'Inertia is resistance to a change in motion.',
 *   errorCode: null,
 *   providerResponseId: 'resp_123',
 *   createdAt,
 * };
 */
export interface QuestionResponseMetadata {
  readonly id: string;
  readonly providerResponseId: string | null;
  readonly createdAt: string;
}

/** Represent a successfully completed AI response. */
export interface QuestionAnswerResponseDto extends QuestionResponseMetadata {
  readonly answer: string;
  readonly errorCode: null;
}

/** Represent a stable AI or dispatch failure response. */
export interface QuestionErrorResponseDto extends QuestionResponseMetadata {
  readonly answer: null;
  readonly errorCode: string;
  readonly providerResponseId: null;
}

/** A valid response is either an answer or a stable failure, never both. */
export type QuestionResponseDto = QuestionAnswerResponseDto | QuestionErrorResponseDto;

/** Validate a client-safe successful AI response. */
export const questionAnswerResponseDtoSchema: z.ZodType<QuestionAnswerResponseDto> = z
  .object({
    id: z.string().uuid(),
    answer: z.string().min(1),
    errorCode: z.null(),
    providerResponseId: z.string().min(1).nullable(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .readonly();

/** Validate a client-safe failed AI response. */
export const questionErrorResponseDtoSchema: z.ZodType<QuestionErrorResponseDto> = z
  .object({
    id: z.string().uuid(),
    answer: z.null(),
    errorCode: z.string().min(1).max(128),
    providerResponseId: z.null(),
    createdAt: z.string().datetime({ offset: true }),
  })
  .readonly();

/** Validate any client-safe AI response DTO at a JSON boundary. */
export const questionResponseDtoSchema: z.ZodType<QuestionResponseDto> = z.union([
  questionAnswerResponseDtoSchema,
  questionErrorResponseDtoSchema,
]);

/**
 * Describe a question returned to its authenticated owner.
 *
 * The response is loaded only through the owner-scoped question; ownership is
 * therefore not duplicated on the response model.
 *
 * @example
 * const question: QuestionDto = {
 *   id,
 *   content,
 *   status: 'queued',
 *   response: null,
 *   createdAt,
 *   updatedAt,
 * };
 */
export interface QuestionDtoMetadata {
  readonly id: string;
  readonly content: QuestionContent;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Represent a question that has no AI response. */
export interface QuestionWithoutResponseDto extends QuestionDtoMetadata {
  readonly status: 'queued' | 'processing' | 'cancellation_requested' | 'cancelled';
  readonly response: null;
}

/** Represent a completed question with its successful AI response. */
export interface CompletedQuestionDto extends QuestionDtoMetadata {
  readonly status: 'completed';
  readonly response: QuestionAnswerResponseDto;
}

/** Represent a failed question with its stable failure response. */
export interface FailedQuestionDto extends QuestionDtoMetadata {
  readonly status: 'failed';
  readonly response: QuestionErrorResponseDto;
}

/** Preserve the relationship between question status and response outcome. */
export type QuestionDto = QuestionWithoutResponseDto | CompletedQuestionDto | FailedQuestionDto;

/** Validate a client-safe question DTO at a JSON boundary. */
const questionDtoMetadataShape = {
  id: z.string().uuid(),
  content: questionContentSchema,
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
} as const;

/** Validate a client-safe question DTO and its status-specific response. */
export const questionDtoSchema: z.ZodType<QuestionDto> = z.union([
  z
    .object({
      ...questionDtoMetadataShape,
      status: z.enum([
        QUESTION_STATUSES.queued,
        QUESTION_STATUSES.processing,
        QUESTION_STATUSES.cancellationRequested,
        QUESTION_STATUSES.cancelled,
      ]),
      response: z.null(),
    })
    .readonly(),
  z
    .object({
      ...questionDtoMetadataShape,
      status: z.literal(QUESTION_STATUSES.completed),
      response: questionAnswerResponseDtoSchema,
    })
    .readonly(),
  z
    .object({
      ...questionDtoMetadataShape,
      status: z.literal(QUESTION_STATUSES.failed),
      response: questionErrorResponseDtoSchema,
    })
    .readonly(),
]);

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
