import { CacheProvider } from '@emotion/react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.component';
import { RouterProvider } from './common/routing/providers/Router.provider';
import './common/styles/global.css';
import { rtlCache } from './common/theme/rtl-cache.config';
import { theme } from './common/theme/app.theme';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CacheProvider value={rtlCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <RouterProvider>
          <App />
        </RouterProvider>
      </ThemeProvider>
    </CacheProvider>
  </StrictMode>,
);
