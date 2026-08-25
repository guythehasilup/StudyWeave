import { z } from 'zod';
import { passwordSchema, usernameSchema } from '../../validators/credentials.schema.js';
import type { LoginInput } from '../types/login-input.type.js';

export const loginSchema: z.ZodType<LoginInput> = z.object({
  username: usernameSchema,
  password: passwordSchema,
});
