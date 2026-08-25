export const normalizePath = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return normalizedPath.length > 1 ? normalizedPath.replace(/\/+$/, '') : normalizedPath;
};
