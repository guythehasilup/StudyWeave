import { DEFAULT_PROTECTED_ROUTE_PATH, DEFAULT_UNPROTECTED_ROUTE_PATH } from './route-paths';

/**
 * Select the login redirect required before rendering a protected route.
 *
 * @param hasAccessToken - Whether the current browser tab contains an access token.
 * @returns The default unprotected path for a guest, otherwise `null`.
 * @example
 * const redirectPath = getProtectedRouteRedirect(false); // '/login'
 */
export const getProtectedRouteRedirect = (hasAccessToken: boolean): string | null =>
  hasAccessToken ? null : DEFAULT_UNPROTECTED_ROUTE_PATH;

/**
 * Select the default protected redirect required before rendering a guest-only route.
 *
 * @param hasAccessToken - Whether the current browser tab contains an access token.
 * @returns The default protected path for an authenticated user, otherwise `null`.
 * @example
 * const redirectPath = getUnprotectedRouteRedirect(true); // '/questions'
 */
export const getUnprotectedRouteRedirect = (hasAccessToken: boolean): string | null =>
  hasAccessToken ? DEFAULT_PROTECTED_ROUTE_PATH : null;

/**
 * Select the fallback URL for an unmatched browser path.
 *
 * @param hasAccessToken - Whether the current browser tab contains an access token.
 * @returns The default protected route for an authenticated user, otherwise the login route.
 * @example
 * const redirectPath = getFallbackRouteRedirect(true); // '/questions'
 */
export const getFallbackRouteRedirect = (hasAccessToken: boolean): string =>
  hasAccessToken ? DEFAULT_PROTECTED_ROUTE_PATH : DEFAULT_UNPROTECTED_ROUTE_PATH;
