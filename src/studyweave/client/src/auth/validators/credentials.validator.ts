import { he } from '../../common/resources/he.resource';
import { normalizeUsername } from '../services/username.service';
import type { LoginValidationErrors } from '../login/types/login-validation.type';

const usernamePattern = /^(?=.{3,50}$)[\p{L}\p{N}._-]+$/u;

export const validateUsername = (username: string): string | undefined => {
  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    return he.validation.usernameRequired;
  }

  if (!usernamePattern.test(normalizedUsername)) {
    return he.validation.usernameInvalid;
  }

  return undefined;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return he.validation.passwordRequired;
  }

  if (password.length < 8 || password.length > 128) {
    return he.validation.passwordLength;
  }

  return undefined;
};

export const validateCredentials = (username: string, password: string): LoginValidationErrors => ({
  username: validateUsername(username),
  password: validatePassword(password),
});
