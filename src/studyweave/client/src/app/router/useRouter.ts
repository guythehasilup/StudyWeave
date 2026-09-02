import { useContext } from 'react';
import { RouterContext } from './router-context';
import type { RouterContextValue } from './router-context';

/**
 * Access normalized URL state and internal navigation.
 *
 * @returns The nearest router context value.
 * @throws {Error} When used outside `RouterProvider`.
 * @example
 * const { pathname, navigate } = useRouter();
 */
export const useRouter = (): RouterContextValue => {
  const context = useContext(RouterContext);

  if (context === null) {
    throw new Error('ROUTER_PROVIDER_MISSING');
  }

  return context;
};
