import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useAuthSession } from '../../features/auth/hooks/useAuthSession';
import { getProtectedRouteRedirect } from './route-redirects';
import { useRouter } from './useRouter';

/**
 * Configure content protected by an unexpired browser-tab session.
 *
 * @example
 * const props: AuthenticatedRouteProps = { children: <QuestionsPage /> };
 */
export interface AuthenticatedRouteProps {
  readonly children: ReactNode;
}

/**
 * Render protected content or redirect when the session is absent or expired.
 *
 * @param props - Nested protected feature page.
 * @returns Protected content, or nothing while redirecting to login.
 * @example
 * <AuthenticatedRoute><QuestionsPage /></AuthenticatedRoute>
 */
export const AuthenticatedRoute = ({ children }: AuthenticatedRouteProps): ReactElement | null => {
  const { navigate } = useRouter();
  const session = useAuthSession();
  const redirectPath = getProtectedRouteRedirect(session !== null);

  useEffect(() => {
    if (redirectPath !== null) navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  return redirectPath === null ? <>{children}</> : null;
};
