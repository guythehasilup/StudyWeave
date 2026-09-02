/**
 * Normalize an application path with one leading slash and no trailing slash.
 *
 * @param path - Internal route path.
 * @returns The normalized browser pathname.
 * @example
 * const path = normalizePath('login/'); // '/login'
 */
export const normalizePath = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return normalizedPath.length > 1 ? normalizedPath.replace(/\/+$/u, '') : normalizedPath;
};
