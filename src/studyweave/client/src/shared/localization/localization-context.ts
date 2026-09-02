import { createContext } from 'react';
import type { Language, TextDirection, TranslationParams } from './localization';
import type { ResourceKey } from './resources';

/**
 * Expose the active language, direction, and typed translation entry point.
 *
 * @example
 * const { direction, translate } = useTranslate();
 */
export type LocalizationContextValue = Readonly<{
  language: Language;
  direction: TextDirection;
  setLanguage: (language: Language) => void;
  translate: (key: ResourceKey, params?: TranslationParams) => string;
}>;

export const LocalizationContext = createContext<LocalizationContextValue | null>(null);
