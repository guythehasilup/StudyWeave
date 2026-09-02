import { useContext } from 'react';
import { LocalizationContext } from './localization-context';
import type { LocalizationContextValue } from './localization-context';

/**
 * Access the current language, direction, and typed translator.
 *
 * @returns The nearest localization context value.
 * @throws {Error} When used outside `LocalizationProvider`.
 * @example
 * const { translate } = useTranslate();
 */
export const useTranslate = (): LocalizationContextValue => {
  const context = useContext(LocalizationContext);

  if (context === null) {
    throw new Error('LOCALIZATION_PROVIDER_MISSING');
  }

  return context;
};
