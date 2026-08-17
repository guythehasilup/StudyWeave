import { Router } from 'express';
import { loginRouter } from './login/login.routes.js';
import { registerRouter } from './register/register.routes.js';

export const authRouter = Router();

authRouter.use(loginRouter);
authRouter.use(registerRouter);
