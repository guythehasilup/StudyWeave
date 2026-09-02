import type { ResourceKey } from '../../shared/localization/resources';

const USERNAME_PATTERN = /^(?=.{3,50}$)[\p{L}\p{N}._-]+$/u;

/**
 * Normalize a username consistently before validation and submission.
 *
 * @param username - User-entered username.
 * @returns A trimmed lowercase username.
 * @example
 * const username = normalizeUsername(' Student '); // 'student'
 */
export const normalizeUsername = (username: string): string => username.trim().toLowerCase();

/**
 * Validate a user-entered username for React Hook Form.
 *
 * @param username - Raw username field value.
 * @returns `true` when valid, otherwise a stable resource key.
 * @example
 * const result = validateUsername('student');
 */
export const validateUsername = (username: string): true | ResourceKey => {
  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername.length === 0) {
    return 'validation.errors.usernameRequired';
  }

  return USERNAME_PATTERN.test(normalizedUsername) ? true : 'validation.errors.usernameInvalid';
};

/**
 * Validate a password for React Hook Form without transforming it.
 *
 * @param password - Raw password field value.
 * @returns `true` when valid, otherwise a stable resource key.
 * @example
 * const result = validatePassword('secure-passphrase');
 */
export const validatePassword = (password: string): true | ResourceKey => {
  if (password.length === 0) {
    return 'validation.errors.passwordRequired';
  }

  return password.length >= 8 && password.length <= 128 ? true : 'validation.errors.passwordLength';
};

/**
 * Validate and normalize a display name for React Hook Form.
 *
 * @param displayName - Raw display-name field value.
 * @returns `true` when valid, otherwise a stable resource key.
 * @example
 * const result = validateDisplayName('Student');
 */
export const validateDisplayName = (displayName: string): true | ResourceKey => {
  const normalizedDisplayName = displayName.trim();

  if (normalizedDisplayName.length === 0) {
    return 'validation.errors.displayNameRequired';
  }

  return normalizedDisplayName.length <= 100 ? true : 'validation.errors.displayNameLength';
};
