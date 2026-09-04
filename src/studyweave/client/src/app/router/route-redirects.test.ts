import { describe, expect, it } from 'vitest';
import { ROUTE_PATHS } from './route-paths';
import {
  getFallbackRouteRedirect,
  getProtectedRouteRedirect,
  getUnprotectedRouteRedirect,
} from './route-redirects';

describe('route redirects', () => {
  it('redirects a guest from protected routes to login', () => {
    expect(getProtectedRouteRedirect(false)).toBe(ROUTE_PATHS.login);
    expect(getProtectedRouteRedirect(true)).toBeNull();
  });

  it('redirects an access-token holder from login and registration to questions', () => {
    expect(getUnprotectedRouteRedirect(true)).toBe(ROUTE_PATHS.questions);
    expect(getUnprotectedRouteRedirect(false)).toBeNull();
  });

  it('redirects unmatched paths according to access-token presence', () => {
    expect(getFallbackRouteRedirect(true)).toBe(ROUTE_PATHS.questions);
    expect(getFallbackRouteRedirect(false)).toBe(ROUTE_PATHS.login);
  });
});
