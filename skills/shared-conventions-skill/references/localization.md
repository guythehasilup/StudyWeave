# English and Hebrew localization

## Contents

1. Resource rules
2. Typed resource implementation
3. React integration
4. Backend error contracts
5. RTL and verification

## 1. Resource rules

Use stable semantic keys grouped by feature and purpose:

```text
common.actions.save
auth.fields.username.label
auth.validation.passwordRequired
users.errors.notFound
```

Do not use a displayed English sentence as a key. Do not concatenate translated fragments to form a sentence. Use named parameters so each language controls its word order.

Every key must exist in English and Hebrew. Every parameter placeholder must exist in both translations with the same name.

## 2. Typed resource implementation

Keep one controlled translation entry point. A small implementation can look like this:

```ts
const ENGLISH_RESOURCES = {
  'common.actions.save': 'Save',
  'users.greeting': 'Hello, {{username}}',
  'users.errors.notFound': 'User not found',
} as const;

export type ResourceKey = keyof typeof ENGLISH_RESOURCES;
export type Language = 'en' | 'he';
export type TextDirection = 'ltr' | 'rtl';
export type TranslationParams = Readonly<Record<string, string | number>>;

export const DEFAULT_LANGUAGE: Language = 'he';

const HEBREW_RESOURCES: Record<ResourceKey, string> = {
  'common.actions.save': 'שמירה',
  'users.greeting': 'שלום, {{username}}',
  'users.errors.notFound': 'המשתמש לא נמצא',
};

const RESOURCES: Readonly<
  Record<Language, Readonly<Record<ResourceKey, string>>>
> = {
  en: ENGLISH_RESOURCES,
  he: HEBREW_RESOURCES,
};

/**
 * Translate a resource key and replace its named parameters.
 *
 * @param key - Stable key that exists in every language dictionary.
 * @param language - Requested language. Defaults to Hebrew (`he`).
 * @param params - Named values inserted into `{{name}}` placeholders. Defaults to an empty object.
 * @returns Localized text for the requested key.
 * @example
 * const greeting = translate('users.greeting', 'he', { username: 'גיא' });
 */
export const translate = (
  key: ResourceKey,
  language: Language = DEFAULT_LANGUAGE,
  params: TranslationParams = {},
): string =>
  Object.entries(params).reduce(
    (text, [name, value]) =>
      text.split(`{{${name}}}`).join(String(value)),
    RESOURCES[language][key],
  );

/**
 * Return the writing direction for a supported language.
 *
 * @param language - Active language. Defaults to Hebrew (`he`).
 * @returns `rtl` for Hebrew and `ltr` for English.
 * @example
 * document.documentElement.dir = getTextDirection('he');
 */
export const getTextDirection = (
  language: Language = DEFAULT_LANGUAGE,
): TextDirection => (language === 'he' ? 'rtl' : 'ltr');
```

Keep the default in the single `DEFAULT_LANGUAGE` constant so it is easy to change. Use the product requirement or persisted user preference when one exists; otherwise default to Hebrew for this convention set. For larger applications, the implementation may wrap an established library such as i18next, but features must still depend on the project's typed `translate`/`useTranslate` abstraction rather than the vendor API directly.

## 3. React integration

Expose current language, direction, `setLanguage`, and `translate` through one provider and hook. Update `document.documentElement.lang` and `.dir` when language changes. Configure Emotion's RTL support at the theme/provider layer.

Do not call `translate` outside render just to create static module constants; language changes would leave stale text. Store keys in configuration and translate during rendering.

```tsx
const navigationItems: readonly NavigationItem[] = [
  { labelKey: 'navigation.home', path: '/' },
  { labelKey: 'navigation.users', path: '/users' },
];
```

## 4. Backend error contracts

Backend code should return stable machine-readable information:

```json
{
  "code": "USER_NOT_FOUND",
  "resourceKey": "users.errors.notFound",
  "correlationId": "8e527d3e-04a0-4de5-b743-7cfe1f786f63"
}
```

Translate on the frontend or another presentation boundary. Server logs may use literal diagnostic messages and should also include the error code and correlation ID.

Do not use localized text for program flow, comparisons, persisted status, event names, metrics, or log searches.

## 5. RTL and verification

- Use logical layout properties and direction-aware icons.
- Keep numbers, identifiers, email addresses, and code snippets readable in mixed-direction content.
- Test dialogs, menus, tables, forms, validation, toasts, and keyboard navigation in both directions.
- Add a test that compares the English and Hebrew key sets.
- Add a test or validation step that compares named placeholders for each matching key.
- Search production UI code for text nodes and human-readable props such as `label`, `title`, `placeholder`, `helperText`, and `aria-label`.
