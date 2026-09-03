import type { ResourceKey } from '../../../shared/localization/resources';
import { getAccessToken } from '../../auth/api/token-storage';
import type {
  CreateQuestionInput,
  QuestionContent,
  QuestionDto,
  QuestionStatus,
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
 * Validate an owner-safe question received from the network.
 *
 * @param value - Unknown parsed response body.
 * @returns true when all required question fields have expected shapes.
 * @example
 * if (isQuestionDto(payload)) return payload;
 */
const isQuestionDto = (value: unknown): value is QuestionDto =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  isQuestionContent(value.content) &&
  isQuestionStatus(value.status) &&
  (value.answer === null || typeof value.answer === 'string') &&
  (value.errorCode === null || typeof value.errorCode === 'string') &&
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
 * Execute one authenticated question request and validate its response.
 *
 * @param path - API-relative question path.
 * @param init - Fetch options. Defaults to a GET request.
 * @returns A validated question DTO.
 * @throws {QuestionApiError} For missing authentication, network, HTTP, or parsing failures.
 * @example
 * const question = await requestQuestion('/api/questions/id', { signal });
 */
const requestQuestion = async (path: string, init: RequestInit = {}): Promise<QuestionDto> => {
  const accessToken = getAccessToken();
  if (accessToken === null) {
    throw new QuestionApiError('AUTHENTICATION_REQUIRED', 'auth.errors.authenticationRequired');
  }

  const response = await fetch(API_BASE_URL + path, {
    ...init,
    headers: {
      Authorization: 'Bearer ' + accessToken,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...init.headers,
    },
  }).catch((): never => {
    throw new QuestionApiError('QUESTION_REQUEST_FAILED', 'questions.errors.requestFailed');
  });
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
export const createQuestion = (input: CreateQuestionInput): Promise<QuestionDto> =>
  requestQuestion('/api/questions', { method: 'POST', body: JSON.stringify(input) });

/**
 * Poll the latest owner-scoped question state.
 *
 * @param questionId - Stable public question identifier.
 * @param signal - TanStack Query cancellation signal.
 * @returns The latest question DTO.
 * @example
 * const question = await getQuestion(questionId, signal);
 */
export const getQuestion = (questionId: string, signal: AbortSignal): Promise<QuestionDto> =>
  requestQuestion('/api/questions/' + encodeURIComponent(questionId), { signal });

/**
 * Request best-effort cancellation for an active question.
 *
 * @param questionId - Stable public question identifier.
 * @returns The latest accepted question state.
 * @example
 * const question = await cancelQuestion(questionId);
 */
export const cancelQuestion = (questionId: string): Promise<QuestionDto> =>
  requestQuestion('/api/questions/' + encodeURIComponent(questionId) + '/cancellations', {
    method: 'POST',
  });
