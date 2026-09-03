import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { AuthenticatedRoute } from './app/router/AuthenticatedRoute';
import { FallbackRoute } from './app/router/FallbackRoute';
import { GuestOnlyRoute } from './app/router/GuestOnlyRoute';
import { protectedRoutes, unprotectedRoutes } from './app/router/routes';
import { useRouter } from './app/router/useRouter';
import { useTranslate } from './shared/localization/useTranslate';

/**
 * Select the active route and synchronize its localized browser title.
 *
 * @returns The component associated with the normalized current path.
 * @example
 * <App />
 */
const App = (): ReactElement => {
  const { pathname } = useRouter();
  const { translate } = useTranslate();
  const protectedRoute = protectedRoutes.find((route) => route.path === pathname);
  const unprotectedRoute = unprotectedRoutes.find((route) => route.path === pathname);
  const activeRoute = protectedRoute ?? unprotectedRoute;
  const productName = translate('common.productName');
  const documentTitle =
    activeRoute === undefined ? productName : `${translate(activeRoute.titleKey)} | ${productName}`;

  useEffect(() => {
    document.title = documentTitle;
  }, [documentTitle]);

  if (activeRoute === undefined) return <FallbackRoute />;

  const Page = activeRoute.component;

  if (protectedRoute !== undefined) {
    return (
      <AuthenticatedRoute>
        <Page />
      </AuthenticatedRoute>
    );
  }

  return (
    <GuestOnlyRoute>
      <Page />
    </GuestOnlyRoute>
  );
};

export default App;
