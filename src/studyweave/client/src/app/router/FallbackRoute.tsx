import { useEffect } from 'react';
import { getAccessToken } from '../../features/auth/api/token-storage';
import { getFallbackRouteRedirect } from './route-redirects';
import { useRouter } from './useRouter';

/**
 * Redirect an unmatched URL to the default route for the current authentication state.
 *
 * @returns Nothing while replacing the unmatched browser URL.
 * @example
 * <FallbackRoute />
 */
export const FallbackRoute = (): null => {
  const { navigate } = useRouter();
  const redirectPath = getFallbackRouteRedirect(getAccessToken() !== null);

  useEffect(() => {
    navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  return null;
};
