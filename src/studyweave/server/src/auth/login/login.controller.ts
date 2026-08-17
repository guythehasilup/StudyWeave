import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController } from '../../common/controllers/base.controller.js';
import { loginLogic } from './login.logic.js';
import type { LoginInput } from './types/login-input.type.js';
import type { LoginSessionResponse } from './types/login-session.type.js';

export class LoginController extends BaseController {
  public readonly login = async (
    request: Request<object, LoginSessionResponse, LoginInput>,
    response: Response<LoginSessionResponse>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const session = await loginLogic.login(request.body);

      this.sendResponse(response, StatusCodes.OK, session);
    });
  };
}

export const loginController = new LoginController();
