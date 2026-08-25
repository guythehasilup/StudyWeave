import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.middleware.js';
import { registerController } from './register.controller.js';
import { registerSchema } from './validators/register.schema.js';

export const registerRouter = Router();

registerRouter.post('/register', validateBody(registerSchema), registerController.register);
