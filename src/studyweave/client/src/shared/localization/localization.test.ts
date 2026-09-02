import { describe, expect, it } from 'vitest';
import { translateResource } from './localization';
import { ENGLISH_RESOURCES, HEBREW_RESOURCES } from './resources';

/**
 * Extract sorted named placeholders from a resource value.
 *
 * @param value - Localized resource text.
 * @returns Sorted placeholder names without braces.
 * @example
 * const placeholders = getPlaceholders('Hello {{name}}'); // ['name']
 */
const getPlaceholders = (value: string): readonly string[] =>
  [...value.matchAll(/\{\{([^{}]+)\}\}/gu)].map((match) => match[1]).sort();

describe('localization resources', () => {
  it('keeps identical English and Hebrew key sets', () => {
    expect(Object.keys(HEBREW_RESOURCES).sort()).toEqual(Object.keys(ENGLISH_RESOURCES).sort());
  });

  it('keeps matching placeholders in every language', () => {
    Object.entries(ENGLISH_RESOURCES).forEach(([key, englishValue]) => {
      const hebrewValue = HEBREW_RESOURCES[key as keyof typeof ENGLISH_RESOURCES];
      expect(getPlaceholders(hebrewValue)).toEqual(getPlaceholders(englishValue));
    });
  });

  it('translates through the controlled entry point', () => {
    expect(translateResource('login.submit', 'en')).toBe('Sign in');
    expect(translateResource('login.submit', 'he')).toBe('התחברות');
  });
});
