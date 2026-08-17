import { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizePath } from '../services/path.service';
import { RouterContext } from './router.context';
import type { NavigateOptions } from '../types/router-context.type';
import type { RouterProviderProps } from '../types/router-provider.type';

export const RouterProvider = ({ children }: RouterProviderProps) => {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = (): void => setPathname(normalizePath(window.location.pathname));

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((path: string, options: NavigateOptions = {}): void => {
    const nextPath = normalizePath(path);
    const historyMethod = options.replace ? 'replaceState' : 'pushState';

    window.history[historyMethod]({}, '', nextPath);
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const contextValue = useMemo(() => ({ pathname, navigate }), [pathname, navigate]);

  return <RouterContext.Provider value={contextValue}>{children}</RouterContext.Provider>;
};
