import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { RouterProvider } from './router/RouterProvider';
import { createAppTheme } from '../common/theme/app.theme';
import { getDirectionalCache } from '../common/theme/rtl-cache.config';
import { LocalizationProvider } from '../shared/localization/LocalizationProvider';
import { useTranslate } from '../shared/localization/useTranslate';

const queryClient = new QueryClient();

/**
 * Properties accepted by the application provider composition.
 *
 * @example
 * const props: AppProvidersProps = { children: <App /> };
 */
export type AppProvidersProps = Readonly<{ children: ReactNode }>;

/**
 * Apply direction-aware Emotion and MUI providers below localization state.
 *
 * @param props - Nested application UI.
 * @returns Direction-aware client providers.
 * @example
 * <DirectionalProviders><App /></DirectionalProviders>
 */
const DirectionalProviders = ({ children }: AppProvidersProps): ReactElement => {
  const { direction } = useTranslate();
  const theme = useMemo(() => createAppTheme(direction), [direction]);
  const cache = getDirectionalCache(direction);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <RouterProvider>{children}</RouterProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </CacheProvider>
  );
};

/**
 * Compose cross-cutting localization, theme, server-state, and URL providers.
 *
 * @param props - Nested application UI.
 * @returns The complete application provider boundary.
 * @example
 * <AppProviders><App /></AppProviders>
 */
export const AppProviders = ({ children }: AppProvidersProps): ReactElement => (
  <LocalizationProvider>
    <DirectionalProviders>{children}</DirectionalProviders>
  </LocalizationProvider>
);
