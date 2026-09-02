import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppProviders } from './app/AppProviders';

const rootElement = document.getElementById('root');

if (rootElement === null) {
  throw new Error('APPLICATION_ROOT_MISSING');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
);
