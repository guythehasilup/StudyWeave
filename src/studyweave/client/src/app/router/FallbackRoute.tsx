import { useEffect } from 'react';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';
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
  const session = useAuthSession();
  const redirectPath = getFallbackRouteRedirect(session !== null);

  useEffect(() => {
    navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  return null;
};
