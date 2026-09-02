import { createContext } from 'react';

/**
 * Options controlling browser-history navigation.
 *
 * @property replace - Replace the current history entry. Defaults to `false`.
 * @example
 * const options: NavigateOptions = { replace: true };
 */
export type NavigateOptions = Readonly<{
  replace?: boolean;
}>;

/**
 * Expose normalized URL state and client-side navigation.
 *
 * @example
 * const value: RouterContextValue = { pathname: '/login', navigate };
 */
export type RouterContextValue = Readonly<{
  pathname: string;
  navigate: (path: string, options?: NavigateOptions) => void;
}>;

export const RouterContext = createContext<RouterContextValue | null>(null);
