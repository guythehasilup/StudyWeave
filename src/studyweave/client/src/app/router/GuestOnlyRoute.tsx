import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';
import { getUnprotectedRouteRedirect } from './route-redirects';
import { useRouter } from './useRouter';

/**
 * Configure content intended only for users without an active session.
 *
 * @example
 * const props: GuestOnlyRouteProps = { children: <LoginPage /> };
 */
export interface GuestOnlyRouteProps {
  readonly children: ReactNode;
}

/**
 * Render guest-only content or redirect an authenticated user to the default protected page.
 *
 * @param props - Nested login or registration page.
 * @returns Guest content, or nothing while redirecting an authenticated user.
 * @example
 * <GuestOnlyRoute><LoginPage /></GuestOnlyRoute>
 */
export const GuestOnlyRoute = ({ children }: GuestOnlyRouteProps): ReactElement | null => {
  const { navigate } = useRouter();
  const session = useAuthSession();
  const redirectPath = getUnprotectedRouteRedirect(session !== null);

  useEffect(() => {
    if (redirectPath !== null) navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  return redirectPath === null ? <>{children}</> : null;
};
