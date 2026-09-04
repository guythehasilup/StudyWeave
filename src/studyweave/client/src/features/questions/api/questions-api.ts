import type { ResourceKey } from '../../../shared/localization/resources';
import { clearAuthSession, getAccessToken } from '../../auth/api/auth-session-storage';
import type {
  CreateQuestionInput,
  QuestionContent,
  QuestionDto,
  QuestionResponseDto,
  QuestionStatus,
  UUID,
} from '../questions.types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const QUESTION_STATUSES: ReadonlySet<QuestionStatus> = new Set([
  'queued',
  'processing',
  'cancellation_requested',
  'completed',
  'failed',
  'cancelled',
]);
const API_ERROR_RESOURCE_KEYS: ReadonlySet<ResourceKey> = new Set([
  'auth.errors.authenticationRequired',
  'common.errors.internal',
  'questions.errors.cancellationFailed',
  'questions.errors.dispatchFailed',
  'questions.errors.notFound',
  'questions.errors.rateLimitExceeded',
  'validation.errors.invalidBody',
]);

/**
 * Carry a parsed question API error to the localized presentation boundary.
 *
 * This class is justified because TanStack Query needs native Error identity
 * while the UI also needs a stable localization key.
 *
 * @param code - Stable server or client parsing error code.
 * @param resourceKey - Typed localization key displayed by the page.
 * @param correlationId - Optional server trace identifier. Defaults to absent.
 * @example
 * throw new QuestionApiError('QUESTION_NOT_FOUND', 'questions.errors.notFound');
 */
export class QuestionApiError extends Error {
  public constructor(
    public readonly code: string,
    public readonly resourceKey: ResourceKey,
    public readonly correlationId?: string,
  ) {
    super(code);
    this.name = 'QuestionApiError';
  }
}

/**
 * Narrow an untrusted value to a non-array object.
 *
 * @param value - Unknown JSON value.
 * @returns true for a non-null object record.
 * @example
 * if (isRecord(payload)) console.log(payload);
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Determine whether an untrusted string is a supported question status.
 *
 * @param value - Unknown status value.
 * @returns true for a stable question lifecycle value.
 * @example
 * const isStatus = isQuestionStatus('queued');
 */
const isQuestionStatus = (value: unknown): value is QuestionStatus =>
  typeof value === 'string' && QUESTION_STATUSES.has(value as QuestionStatus);

/** Validate and narrow an untrusted value to a UUID-shaped identifier. */
const isUuid = (value: unknown): value is UUID =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value);

/**
 * Validate the text-only content returned by the current API.
 *
 * @param value - Unknown content value.
 * @returns true when every ordered part contains valid text.
 * @example
 * const isContent = isQuestionContent(payload.content);
 */
const isQuestionContent = (value: unknown): value is QuestionContent =>
  isRecord(value) &&
  Array.isArray(value.parts) &&
  value.parts.length > 0 &&
  value.parts.every(
    (part) => isRecord(part) && part.type === 'text' && typeof part.text === 'string',
  );

/**
 * Validate an AI response nested under an owner-authorized question.
 *
 * @param value - Unknown response value.
 * @returns true when identifiers, outcome fields, and timestamp are valid.
 * @example
 * const isResponse = isQuestionResponseDto(payload.response);
 */
const isQuestionResponseDto = (value: unknown): value is QuestionResponseDto =>
  isRecord(value) &&
  isUuid(value.id) &&
  (value.providerResponseId === null || typeof value.providerResponseId === 'string') &&
  typeof value.createdAt === 'string' &&
  ((typeof value.answer === 'string' && value.errorCode === null) ||
    (value.answer === null &&
      typeof value.errorCode === 'string' &&
      value.providerResponseId === null));

/**
 * Validate an owner-safe question received from the network.
 *
 * @param value - Unknown parsed response body.
 * @returns true when all required question fields have expected shapes.
 * @example
 * if (isQuestionDto(payload)) return payload;
 */
const isQuestionDto = (value: unknown): value is QuestionDto =>
  isRecord(value) &&
  isUuid(value.id) &&
  isQuestionContent(value.content) &&
  isQuestionStatus(value.status) &&
  (value.status === 'completed'
    ? isQuestionResponseDto(value.response) && value.response.answer !== null
    : value.status === 'failed'
      ? isQuestionResponseDto(value.response) && value.response.answer === null
      : value.response === null) &&
  typeof value.createdAt === 'string' &&
  typeof value.updatedAt === 'string';

/**
 * Parse JSON without leaking malformed response errors beyond the API adapter.
 *
 * @param response - Fetch response from a question endpoint.
 * @returns Parsed JSON or null when absent or malformed.
 * @example
 * const payload = await parseJson(response);
 */
const parseJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Narrow a server resource key to one translated by this API feature.
 *
 * @param value - Unknown error resource key.
 * @returns true when the client has a corresponding localized resource.
 * @example
 * const isKnown = isApiResourceKey(payload.resourceKey);
 */
const isApiResourceKey = (value: unknown): value is ResourceKey =>
  typeof value === 'string' && API_ERROR_RESOURCE_KEYS.has(value as ResourceKey);

/**
 * Require the authentication header shared by question operations.
 *
 * @returns A bearer authorization header.
 * @throws {QuestionApiError} When no access token is available.
 * @example
 * const headers = getAuthorizationHeaders();
 */
const getAuthorizationHeaders = (): Record<string, string> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new QuestionApiError('AUTHENTICATION_REQUIRED', 'auth.errors.authenticationRequired');
  }

  return { Authorization: 'Bearer ' + accessToken };
};

/**
 * Validate a question endpoint response and translate API failures.
 *
 * @param response - Response returned by a question operation.
 * @returns A validated question DTO.
 * @throws {QuestionApiError} For unsuccessful or malformed responses.
 * @example
 * const question = await parseQuestionResponse(response);
 */
const parseQuestionResponse = async (response: Response): Promise<QuestionDto> => {
  if (response.status === 401) clearAuthSession();
  const payload = await parseJson(response);

  if (!response.ok) {
    const code =
      isRecord(payload) && typeof payload.code === 'string'
        ? payload.code
        : 'QUESTION_REQUEST_FAILED';
    const resourceKey =
      isRecord(payload) && isApiResourceKey(payload.resourceKey)
        ? payload.resourceKey
        : 'questions.errors.requestFailed';
    const correlationId =
      isRecord(payload) && typeof payload.correlationId === 'string'
        ? payload.correlationId
        : undefined;

    throw new QuestionApiError(code, resourceKey, correlationId);
  }

  if (!isQuestionDto(payload)) {
    throw new QuestionApiError('INVALID_QUESTION_RESPONSE', 'questions.errors.invalidResponse');
  }

  return payload;
};

/**
 * Submit a question and receive its queued server state.
 *
 * @param input - Extensible validated question content.
 * @returns The accepted question without waiting for AI completion.
 * @example
 * const question = await createQuestion(input);
 */
export const createQuestion = async (input: CreateQuestionInput): Promise<QuestionDto> => {
  const response = await fetch(API_BASE_URL + '/api/questions', {
    method: 'POST',
    headers: {
      ...getAuthorizationHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }).catch((): never => {
    throw new QuestionApiError('QUESTION_REQUEST_FAILED', 'questions.errors.requestFailed');
  });

  return parseQuestionResponse(response);
};

/**
 * Poll the latest owner-scoped question state.
 *
 * @param questionId - Stable public question identifier.
 * @param signal - TanStack Query cancellation signal.
 * @returns The latest question DTO.
 * @example
 * const question = await getQuestion(questionId, signal);
 */
export const getQuestion = async (questionId: UUID, signal: AbortSignal): Promise<QuestionDto> => {
  const response = await fetch(API_BASE_URL + '/api/questions/' + encodeURIComponent(questionId), {
    headers: getAuthorizationHeaders(),
    signal,
  }).catch((): never => {
    throw new QuestionApiError('QUESTION_REQUEST_FAILED', 'questions.errors.requestFailed');
  });

  return parseQuestionResponse(response);
};

/**
 * Request best-effort cancellation for an active question.
 *
 * @param questionId - Stable public question identifier.
 * @returns The latest accepted question state.
 * @example
 * const question = await cancelQuestion(questionId);
 */
export const cancelQuestion = async (questionId: UUID): Promise<QuestionDto> => {
  const response = await fetch(
    API_BASE_URL + '/api/questions/' + encodeURIComponent(questionId) + '/cancellations',
    {
      method: 'POST',
      headers: getAuthorizationHeaders(),
    },
  ).catch((): never => {
    throw new QuestionApiError('QUESTION_REQUEST_FAILED', 'questions.errors.requestFailed');
  });

  return parseQuestionResponse(response);
};
