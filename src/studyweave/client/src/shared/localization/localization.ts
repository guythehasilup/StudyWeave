import { ENGLISH_RESOURCES, HEBREW_RESOURCES } from './resources';
import type { ResourceKey } from './resources';

/**
 * Supported interface languages.
 *
 * @example
 * const language: Language = 'he';
 */
export type Language = 'en' | 'he';

/**
 * Supported document writing directions.
 *
 * @example
 * const direction: TextDirection = 'rtl';
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Named values inserted into translation placeholders.
 *
 * @example
 * const params: TranslationParams = { username: 'student' };
 */
export type TranslationParams = Readonly<Record<string, string | number>>;

export const DEFAULT_LANGUAGE: Language = 'he';

const RESOURCES: Readonly<Record<Language, Readonly<Record<ResourceKey, string>>>> = {
  en: ENGLISH_RESOURCES,
  he: HEBREW_RESOURCES,
};

/**
 * Translate a stable key and interpolate named parameters.
 *
 * @param key - Resource key present in English and Hebrew.
 * @param language - Requested language. Defaults to Hebrew (`he`).
 * @param params - Named placeholder values. Defaults to an empty object.
 * @returns Localized product text.
 * @example
 * const label = translateResource('login.submit', 'he');
 */
export const translateResource = (
  key: ResourceKey,
  language: Language = DEFAULT_LANGUAGE,
  params: TranslationParams = {},
): string =>
  Object.entries(params).reduce(
    (text, [name, value]) => text.split(`{{${name}}}`).join(String(value)),
    RESOURCES[language][key],
  );

/**
 * Return the writing direction for a supported language.
 *
 * @param language - Active language. Defaults to Hebrew (`he`).
 * @returns `rtl` for Hebrew and `ltr` for English.
 * @example
 * const direction = getTextDirection('he');
 */
export const getTextDirection = (language: Language = DEFAULT_LANGUAGE): TextDirection =>
  language === 'he' ? 'rtl' : 'ltr';
