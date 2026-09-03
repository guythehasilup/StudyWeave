/**
 * Enumerate stable error codes exposed by the current HTTP API.
 *
 * @example
 * const code: ApiErrorCode = 'INVALID_CREDENTIALS';
 */
export type ApiErrorCode =
  | 'AUTHENTICATION_REQUIRED'
  | 'INTERNAL_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'NOT_FOUND'
  | 'QUESTION_CANCELLATION_FAILED'
  | 'QUESTION_DISPATCH_FAILED'
  | 'QUESTION_NOT_FOUND'
  | 'USERNAME_TAKEN'
  | 'VALIDATION_FAILED';

/**
 * Enumerate localization keys that clients may translate for API failures.
 *
 * @example
 * const key: ApiResourceKey = 'auth.errors.invalidCredentials';
 */
export type ApiResourceKey =
  | 'auth.errors.invalidCredentials'
  | 'auth.errors.authenticationRequired'
  | 'auth.errors.usernameTaken'
  | 'common.errors.internal'
  | 'common.errors.notFound'
  | 'questions.errors.cancellationFailed'
  | 'questions.errors.dispatchFailed'
  | 'questions.errors.notFound'
  | 'validation.errors.invalidBody';

/**
 * Carry a known HTTP failure through Express without leaking dependency errors.
 *
 * This class is justified because native `Error` identity preserves stack traces
 * and enables reliable `instanceof` narrowing in the centralized error adapter.
 *
 * @param statusCode - HTTP status returned to the client.
 * @param code - Stable machine-readable error code.
 * @param resourceKey - Stable localization key translated by the client.
 * @param details - Optional non-sensitive structured context. Defaults to absent.
 * @example
 * throw new ApiError(401, 'INVALID_CREDENTIALS', 'auth.errors.invalidCredentials');
 */
export class ApiError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: ApiErrorCode,
    public readonly resourceKey: ApiResourceKey,
    public readonly details?: Readonly<Record<string, unknown>>,
  ) {
    super(code);
    this.name = 'ApiError';
  }
}
