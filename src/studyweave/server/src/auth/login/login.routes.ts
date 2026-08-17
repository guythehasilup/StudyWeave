import { Router } from 'express';
import { validateBody } from '../../common/middleware/validate.middleware.js';
import { loginController } from './login.controller.js';
import { loginSchema } from './validators/login.schema.js';

export const loginRouter = Router();

loginRouter.post('/login', validateBody(loginSchema), loginController.login);
