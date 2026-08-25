import { he } from '../../../common/resources/he.resource';
import { validateCredentials } from '../../validators/credentials.validator';
import type { RegisterValidationErrors } from '../types/register-validation.type';

export const validateDisplayName = (displayName: string): string | undefined => {
  const normalizedDisplayName = displayName.trim();

  if (!normalizedDisplayName) {
    return he.validation.displayNameRequired;
  }

  if (normalizedDisplayName.length > 100) {
    return he.validation.displayNameLength;
  }

  return undefined;
};

export const validateRegistration = (
  displayName: string,
  username: string,
  password: string,
): RegisterValidationErrors => ({
  ...validateCredentials(username, password),
  displayName: validateDisplayName(displayName),
});
