import { useEffect } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { getAccessToken } from '../../features/auth/api/token-storage';
import { getProtectedRouteRedirect } from './route-redirects';
import { useRouter } from './useRouter';

/**
 * Configure content protected by browser-tab authentication.
 *
 * @example
 * const props: AuthenticatedRouteProps = { children: <QuestionsPage /> };
 */
export type AuthenticatedRouteProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Render protected route content or redirect to login when no token exists.
 *
 * @param props - Nested protected feature page.
 * @returns Protected content, or nothing while redirecting to login.
 * @example
 * <AuthenticatedRoute><QuestionsPage /></AuthenticatedRoute>
 */
export const AuthenticatedRoute = ({ children }: AuthenticatedRouteProps): ReactElement | null => {
  const { navigate } = useRouter();
  const redirectPath = getProtectedRouteRedirect(getAccessToken() !== null);

  useEffect(() => {
    if (redirectPath !== null) navigate(redirectPath, { replace: true });
  }, [navigate, redirectPath]);

  return redirectPath === null ? <>{children}</> : null;
};
