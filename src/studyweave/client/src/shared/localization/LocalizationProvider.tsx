import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { DEFAULT_LANGUAGE, getTextDirection, translateResource } from './localization';
import type { Language, TranslationParams } from './localization';
import type { ResourceKey } from './resources';
import { LocalizationContext } from './localization-context';

const LANGUAGE_STORAGE_KEY = 'studyweave.language';

/**
 * Properties accepted by the localization boundary.
 *
 * @example
 * const props: LocalizationProviderProps = { children: <App /> };
 */
export type LocalizationProviderProps = Readonly<{ children: ReactNode }>;

/**
 * Load a supported persisted language without trusting browser storage.
 *
 * @returns The stored language or Hebrew when storage is absent or unavailable.
 * @example
 * const language = readInitialLanguage();
 */
const readInitialLanguage = (): Language => {
  try {
    const language = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return language === 'en' || language === 'he' ? language : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

/**
 * Own localization state and synchronize browser language and direction metadata.
 *
 * @param props - Provider children.
 * @returns A localization context boundary.
 * @example
 * <LocalizationProvider><App /></LocalizationProvider>
 */
export const LocalizationProvider = ({ children }: LocalizationProviderProps): ReactElement => {
  const [language, setLanguageState] = useState<Language>(readInitialLanguage);
  const direction = getTextDirection(language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [direction, language]);

  /**
   * Persist and activate a supported interface language.
   *
   * @param nextLanguage - English or Hebrew language selection.
   * @returns Nothing.
   * @example
   * setLanguage('en');
   */
  const setLanguage = useCallback((nextLanguage: Language): void => {
    setLanguageState(nextLanguage);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // Storage is an optional enhancement; in-memory language remains authoritative.
    }
  }, []);

  /**
   * Translate a resource using the current language.
   *
   * @param key - Stable semantic resource key.
   * @param params - Optional named interpolation values. Defaults to empty.
   * @returns Localized product text.
   * @example
   * const heading = translate('login.heading');
   */
  const translate = useCallback(
    (key: ResourceKey, params: TranslationParams = {}): string =>
      translateResource(key, language, params),
    [language],
  );
  const value = useMemo(
    () => ({ language, direction, setLanguage, translate }),
    [direction, language, setLanguage, translate],
  );

  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
};
