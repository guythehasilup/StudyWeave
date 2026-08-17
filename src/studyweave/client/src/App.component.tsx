import { useEffect } from 'react';
import { he } from './common/resources/he.resource';
import { fallbackRoute, routes } from './common/routing/app.routes';
import { useRouter } from './common/routing/hooks/useRouter.hook';

const App = () => {
  const { pathname } = useRouter();
  const activeRoute = routes.find((route) => route.path === pathname) ?? fallbackRoute;
  const Page = activeRoute.component;
  const Layout = activeRoute.layout;

  useEffect(() => {
    document.documentElement.lang = 'he';
    document.documentElement.dir = 'rtl';
    document.title = `${activeRoute.title} | ${he.common.productName}`;
  }, [activeRoute.title]);

  return (
    <Layout>
      <Page />
    </Layout>
  );
};

export default App;
