import { z } from 'zod';
import type { LoginInput, RegisterInput } from './auth.contracts.js';

const USERNAME_PATTERN = /^(?=.{3,50}$)[\p{L}\p{N}._-]+$/u;

const usernameSchema = z
  .string({ error: 'validation.errors.usernameRequired' })
  .trim()
  .toLowerCase()
  .pipe(z.string().regex(USERNAME_PATTERN, 'validation.errors.usernameInvalid'));

const passwordSchema = z
  .string({ error: 'validation.errors.passwordRequired' })
  .min(8, 'validation.errors.passwordLength')
  .max(128, 'validation.errors.passwordLength');

/** Validate and normalize an untrusted login body at the HTTP boundary. */
export const loginSchema: z.ZodType<LoginInput> = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/** Validate and normalize an untrusted registration body at the HTTP boundary. */
export const registerSchema: z.ZodType<RegisterInput> = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: z
    .string({ error: 'validation.errors.displayNameRequired' })
    .trim()
    .min(1, 'validation.errors.displayNameRequired')
    .max(100, 'validation.errors.displayNameLength'),
});
