import { z } from 'zod';
import { he } from '../../common/resources/he.resource.js';
import { usernamePattern } from '../../infra/users/validators/username.validator.js';
import { normalizeUsername } from '../services/username.service.js';

export const usernameSchema = z
  .string({ error: he.validation.usernameRequired })
  .transform(normalizeUsername)
  .pipe(z.string().regex(usernamePattern, he.validation.usernameInvalid));

export const passwordSchema = z
  .string({ error: he.validation.passwordRequired })
  .min(8, he.validation.passwordLength)
  .max(128, he.validation.passwordLength);
