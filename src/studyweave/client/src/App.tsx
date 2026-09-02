import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { fallbackRoute, routes } from './app/router/routes';
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
  const activeRoute = routes.find((route) => route.path === pathname) ?? fallbackRoute;
  const Page = activeRoute.component;
  const pageTitle = translate(activeRoute.titleKey);
  const productName = translate('common.productName');

  useEffect(() => {
    document.title = `${pageTitle} | ${productName}`;
  }, [pageTitle, productName]);

  return <Page />;
};

export default App;
