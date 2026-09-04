import { isAuthUserDto } from '../auth.types';
import type { AuthSessionDto, AuthUserDto } from '../auth.types';

const ACCESS_TOKEN_KEY = 'studyweave.accessToken';
const AUTH_USER_KEY = 'studyweave.user';
const authSessionListeners = new Set<() => void>();

/**
 * Read the current browser-tab storage when a DOM environment is available.
 *
 * @returns Session storage, or null during non-browser rendering and tests.
 * @example
 * const storage = getSessionStorage();
 */
const getSessionStorage = (): Storage | null =>
  typeof globalThis.sessionStorage === 'undefined' ? null : globalThis.sessionStorage;

/**
 * Decode the expiration timestamp from an unsigned JWT payload.
 *
 * This client-side check does not establish trust; server signature and claim
 * verification remains authoritative.
 *
 * @param accessToken - Encoded JWT received from the server.
 * @returns Expiration epoch milliseconds, or null for malformed/missing claims.
 * @example
 * const expiresAt = getAccessTokenExpiration(accessToken);
 */
export const getAccessTokenExpiration = (accessToken: string): number | null => {
  try {
    const segments = accessToken.split('.');
    if (segments.length !== 3 || segments[1] === undefined) return null;

    const encodedPayload = segments[1].replace(/-/gu, '+').replace(/_/gu, '/');
    const padding = '='.repeat((4 - (encodedPayload.length % 4)) % 4);
    const payload = JSON.parse(globalThis.atob(encodedPayload + padding)) as unknown;
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;

    const expirationSeconds = (payload as Record<string, unknown>).exp;
    return typeof expirationSeconds === 'number' && Number.isFinite(expirationSeconds)
      ? expirationSeconds * 1_000
      : null;
  } catch {
    return null;
  }
};

/**
 * Determine whether a JWT has a well-formed expiration claim in the future.
 *
 * @param accessToken - Encoded JWT to inspect without trusting its signature.
 * @param now - Current epoch milliseconds. Defaults to `Date.now()`.
 * @returns True only while the token expiration is in the future.
 * @example
 * const isActive = isAccessTokenActive(accessToken);
 */
export const isAccessTokenActive = (accessToken: string, now = Date.now()): boolean => {
  const expiresAt = getAccessTokenExpiration(accessToken);
  return expiresAt !== null && expiresAt > now;
};

/** Notify current-tab subscribers that authentication storage changed. */
const notifyAuthSessionChanged = (): void => {
  for (const listener of authSessionListeners) listener();
};

/**
 * Read and validate the complete browser-tab session without mutating storage.
 *
 * @returns The current unexpired session, or null for absent or invalid data.
 * @example
 * const session = readAuthSession();
 */
export const readAuthSession = (): AuthSessionDto | null => {
  const storage = getSessionStorage();
  const accessToken = storage?.getItem(ACCESS_TOKEN_KEY) ?? null;
  const serializedUser = storage?.getItem(AUTH_USER_KEY) ?? null;
  if (accessToken === null || serializedUser === null || !isAccessTokenActive(accessToken)) {
    return null;
  }

  try {
    const user = JSON.parse(serializedUser) as unknown;
    return isAuthUserDto(user) ? { accessToken, user } : null;
  } catch {
    return null;
  }
};

/**
 * Store the access token and public user object for the current browser tab.
 *
 * @param session - Validated session returned by login or registration.
 * @returns Nothing after subscribers are notified.
 * @example
 * storeAuthSession(session);
 */
export const storeAuthSession = (session: AuthSessionDto): void => {
  const storage = getSessionStorage();
  storage?.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
  storage?.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  notifyAuthSessionChanged();
};

/**
 * Remove token and public user data from the current browser tab.
 *
 * @returns Nothing after subscribers are notified.
 * @example
 * clearAuthSession();
 */
export const clearAuthSession = (): void => {
  const storage = getSessionStorage();
  storage?.removeItem(ACCESS_TOKEN_KEY);
  storage?.removeItem(AUTH_USER_KEY);
  notifyAuthSessionChanged();
};

/**
 * Read an access token and clear the session when it is invalid or expired.
 *
 * @returns The active access token, or null after invalid session cleanup.
 * @example
 * const accessToken = getAccessToken();
 */
export const getAccessToken = (): string | null => {
  const session = readAuthSession();
  if (session !== null) return session.accessToken;

  clearAuthSession();
  return null;
};

/**
 * Read the public authenticated user stored for the current browser tab.
 *
 * @returns The user associated with an unexpired session, or null.
 * @example
 * const user = getAuthUser();
 */
export const getAuthUser = (): AuthUserDto | null => readAuthSession()?.user ?? null;

/**
 * Subscribe to same-tab authentication changes.
 *
 * @param listener - Callback invoked after login or session cleanup.
 * @returns An unsubscribe operation.
 * @example
 * const unsubscribe = subscribeAuthSession(handleSessionChange);
 */
export const subscribeAuthSession = (listener: () => void): (() => void) => {
  authSessionListeners.add(listener);
  return () => authSessionListeners.delete(listener);
};
