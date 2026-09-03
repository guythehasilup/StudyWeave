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
export type TextQuestionContentPart = Readonly<{
  type: 'text';
  text: string;
}>;

/**
 * Ordered question input prepared for future multimodal parts.
 *
 * @example
 * const content: QuestionContent = { parts: [{ type: 'text', text: 'Explain this.' }] };
 */
export type QuestionContent = Readonly<{
  parts: readonly TextQuestionContentPart[];
}>;

/**
 * Describe the owner-safe question returned by submission and polling.
 *
 * @example
 * const question: QuestionDto = { id, content, status: 'queued', answer: null, errorCode: null, createdAt, updatedAt };
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

/**
 * Represent editable text owned by React Hook Form.
 *
 * @example
 * const values: QuestionFormValues = { questionText: '' };
 */
export type QuestionFormValues = Readonly<{
  questionText: string;
}>;

/**
 * Describe the extensible create-question request body.
 *
 * @example
 * const input: CreateQuestionInput = { content: { parts: [{ type: 'text', text: 'Why?' }] } };
 */
export type CreateQuestionInput = Readonly<{
  content: QuestionContent;
}>;

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
