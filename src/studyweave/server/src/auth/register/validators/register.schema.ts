import { z } from 'zod';
import { he } from '../../../common/resources/he.resource.js';
import { passwordSchema, usernameSchema } from '../../validators/credentials.schema.js';
import type { RegisterInput } from '../types/register-input.type.js';

export const registerSchema: z.ZodType<RegisterInput> = z.object({
  username: usernameSchema,
  password: passwordSchema,
  displayName: z
    .string({ error: he.validation.displayNameRequired })
    .trim()
    .min(1, he.validation.displayNameRequired)
    .max(100, he.validation.displayNameLength),
});
