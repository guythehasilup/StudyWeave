/**
 * Stable lifecycle state returned by the asynchronous question API.
 *
 * @example
 * const status: QuestionStatus = 'processing';
 */
export type QuestionStatus =
  'queued' | 'processing' | 'cancellation_requested' | 'completed' | 'failed' | 'cancelled';

/**
 * Text input part supported by the current question POC.
 *
 * @example
 * const part: TextQuestionContentPart = { type: 'text', text: 'What is inertia?' };
 */
export interface TextQuestionContentPart {
  readonly type: 'text';
  readonly text: string;
}

/**
 * Ordered question input prepared for future multimodal parts.
 *
 * @example
 * const content: QuestionContent = { parts: [{ type: 'text', text: 'Explain this.' }] };
 */
export interface QuestionContent {
  readonly parts: readonly TextQuestionContentPart[];
}

/**
 * Describe the AI outcome nested under an owner-authorized question.
 *
 * @example
 * const response: QuestionResponseDto = {
 *   id,
 *   answer: 'Inertia resists changes in motion.',
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

/**
 * Describe the owner-safe question returned by submission and polling.
 *
 * @example
 * const question: QuestionDto = { id, content, status: 'queued', response: null, createdAt, updatedAt };
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

/**
 * Represent editable text owned by React Hook Form.
 *
 * @example
 * const values: QuestionFormValues = { questionText: '' };
 */
export interface QuestionFormValues {
  readonly questionText: string;
}

/**
 * Describe the extensible create-question request body.
 *
 * @example
 * const input: CreateQuestionInput = { content: { parts: [{ type: 'text', text: 'Why?' }] } };
 */
export interface CreateQuestionInput {
  readonly content: QuestionContent;
}

/**
 * Determine whether the current question can still be stopped.
 *
 * @param status - Latest server-authored question state.
 * @returns true while queued, processing, or awaiting cancellation.
 * @example
 * const isActive = isActiveQuestionStatus('queued');
 */
export const isActiveQuestionStatus = (status: QuestionStatus): boolean =>
  status === 'queued' || status === 'processing' || status === 'cancellation_requested';
