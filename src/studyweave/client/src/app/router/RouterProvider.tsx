import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { normalizePath } from './path';
import { RouterContext } from './router-context';
import type { NavigateOptions } from './router-context';

/**
 * Properties accepted by the URL-state provider.
 *
 * @example
 * const props: RouterProviderProps = { children: <App /> };
 */
export type RouterProviderProps = Readonly<{ children: ReactNode }>;

/**
 * Own normalized browser pathname state and History API navigation.
 *
 * @param props - Nested routed application UI.
 * @returns A router context provider.
 * @example
 * <RouterProvider><App /></RouterProvider>
 */
export const RouterProvider = ({ children }: RouterProviderProps): ReactElement => {
  const [pathname, setPathname] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    /**
     * Synchronize route state after browser back or forward navigation.
     *
     * @returns Nothing.
     * @example
     * window.dispatchEvent(new PopStateEvent('popstate'));
     */
    const handlePopState = (): void => {
      setPathname(normalizePath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * Navigate to an internal route through the browser History API.
   *
   * @param path - Internal destination path.
   * @param options - History behavior. Defaults to a new entry.
   * @returns Nothing.
   * @example
   * navigate('/login', { replace: true });
   */
  const navigate = useCallback((path: string, options: NavigateOptions = {}): void => {
    const nextPath = normalizePath(path);
    const historyMethod = options.replace ? 'replaceState' : 'pushState';

    window.history[historyMethod]({}, '', nextPath);
    setPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const value = useMemo(() => ({ pathname, navigate }), [navigate, pathname]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};
