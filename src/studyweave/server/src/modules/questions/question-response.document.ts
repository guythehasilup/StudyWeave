/**
 * Represent one immutable AI outcome in the server-owned responses collection.
 *
 * Ownership is intentionally resolved through `QuestionDocument.responseId`, so
 * neither `userId` nor `questionId` is duplicated on this document.
 *
 * @example
 * const response: QuestionResponseDocument = {
 *   id,
 *   answer: 'Inertia resists changes in motion.',
 *   errorCode: null,
 *   providerResponseId: 'resp_123',
 *   createdAt: new Date(),
 * };
 */
interface QuestionResponseDocumentMetadata {
  readonly id: string;
  readonly providerResponseId: string | null;
  readonly createdAt: Date;
}

/** Persist a successful AI answer. */
interface QuestionAnswerResponseDocument extends QuestionResponseDocumentMetadata {
  readonly answer: string;
  readonly errorCode: null;
}

/** Persist a stable AI or dispatch failure. */
interface QuestionErrorResponseDocument extends QuestionResponseDocumentMetadata {
  readonly answer: null;
  readonly errorCode: string;
  readonly providerResponseId: null;
}

/** A persisted response is either a successful answer or a stable failure. */
export type QuestionResponseDocument =
  QuestionAnswerResponseDocument | QuestionErrorResponseDocument;
