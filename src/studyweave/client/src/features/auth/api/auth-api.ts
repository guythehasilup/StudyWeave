import type { ResourceKey } from '../../../shared/localization/resources';
import type { AuthSessionDto, LoginInput, RegisterInput } from '../auth.types';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const API_ERROR_RESOURCE_KEYS: ReadonlySet<ResourceKey> = new Set([
  'auth.errors.invalidCredentials',
  'auth.errors.usernameTaken',
  'common.errors.internal',
  'common.errors.notFound',
  'validation.errors.invalidBody',
]);

/**
 * Carry a parsed API error to the localized presentation boundary.
 *
 * This class is justified because error identity is required for TanStack Query
 * narrowing while preserving the native error stack and lifecycle.
 *
 * @param code - Stable server error code.
 * @param resourceKey - Typed client localization key.
 * @param correlationId - Optional request trace identifier. Defaults to absent.
 * @example
 * throw new AuthApiError('INVALID_CREDENTIALS', 'auth.errors.invalidCredentials');
 */
export class AuthApiError extends Error {
  public constructor(
    public readonly code: string,
    public readonly resourceKey: ResourceKey,
    public readonly correlationId?: string,
  ) {
    super(code);
    this.name = 'AuthApiError';
  }
}

/**
 * Narrow an untrusted JSON value to an object record.
 *
 * @param value - Unknown parsed response body.
 * @returns `true` when the value is a non-null, non-array object.
 * @example
 * if (isRecord(payload)) console.log(payload);
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Check whether a server-provided key is supported by this client.
 *
 * @param value - Untrusted resource-key value.
 * @returns `true` when the client can translate the key.
 * @example
 * const isKnown = isApiResourceKey(payload.resourceKey);
 */
const isApiResourceKey = (value: unknown): value is ResourceKey =>
  typeof value === 'string' && API_ERROR_RESOURCE_KEYS.has(value as ResourceKey);

/**
 * Validate the authentication session received from the network boundary.
 *
 * @param value - Untrusted parsed JSON value.
 * @returns `true` when required session and user fields have expected shapes.
 * @example
 * if (isAuthSessionDto(payload)) return payload;
 */
const isAuthSessionDto = (value: unknown): value is AuthSessionDto => {
  if (!isRecord(value) || typeof value.accessToken !== 'string' || !isRecord(value.user)) {
    return false;
  }

  const { user } = value;

  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.displayName === 'string' &&
    typeof user.isActive === 'boolean' &&
    (user.lastLoginAt === null || typeof user.lastLoginAt === 'string') &&
    typeof user.createdAt === 'string' &&
    typeof user.updatedAt === 'string'
  );
};

/**
 * Parse a response body without allowing malformed JSON to escape the API layer.
 *
 * @param response - Fetch response returned by the authentication endpoint.
 * @returns Parsed JSON, or `null` when the body is absent or malformed.
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
 * Request and validate a login or registration session.
 *
 * @param endpoint - Authentication operation name.
 * @param body - Validated request DTO.
 * @returns The validated authenticated session.
 * @throws {AuthApiError} For HTTP failures or malformed success payloads.
 * @example
 * const session = await requestAuthSession('login', input);
 */
const requestAuthSession = async (
  endpoint: 'login' | 'register',
  body: LoginInput | RegisterInput,
): Promise<AuthSessionDto> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch((): never => {
    throw new AuthApiError('AUTH_REQUEST_FAILED', 'auth.errors.requestFailed');
  });

  const payload = await parseJson(response);

  if (!response.ok) {
    const code =
      isRecord(payload) && typeof payload.code === 'string' ? payload.code : 'AUTH_REQUEST_FAILED';
    const resourceKey =
      isRecord(payload) && isApiResourceKey(payload.resourceKey)
        ? payload.resourceKey
        : 'auth.errors.requestFailed';
    const correlationId =
      isRecord(payload) && typeof payload.correlationId === 'string'
        ? payload.correlationId
        : undefined;

    throw new AuthApiError(code, resourceKey, correlationId);
  }

  if (!isAuthSessionDto(payload)) {
    throw new AuthApiError('INVALID_AUTH_RESPONSE', 'auth.errors.invalidResponse');
  }

  return payload;
};

/**
 * Authenticate an existing account.
 *
 * @param input - Validated normalized credentials.
 * @returns The authenticated session.
 * @example
 * const session = await login(input);
 */
export const login = (input: LoginInput): Promise<AuthSessionDto> =>
  requestAuthSession('login', input);

/**
 * Register a new account.
 *
 * @param input - Validated normalized account fields.
 * @returns The authenticated session.
 * @example
 * const session = await register(input);
 */
export const register = (input: RegisterInput): Promise<AuthSessionDto> =>
  requestAuthSession('register', input);
