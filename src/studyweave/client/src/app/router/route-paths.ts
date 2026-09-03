/**
 * Define stable application paths shared by route guards and feature navigation.
 *
 * @example
 * navigate(ROUTE_PATHS.questions);
 */
export const ROUTE_PATHS = {
  root: '/',
  login: '/login',
  register: '/register',
  questions: '/questions',
} as const;

/** Default destination for an authenticated user. */
export const DEFAULT_PROTECTED_ROUTE_PATH = ROUTE_PATHS.questions;

/** Default destination for a user without an access token. */
export const DEFAULT_UNPROTECTED_ROUTE_PATH = ROUTE_PATHS.login;
