import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController } from '../../common/controllers/base.controller.js';
import { registerLogic } from './register.logic.js';
import type { RegisterInput } from './types/register-input.type.js';
import type { RegisterSessionResponse } from './types/register-session.type.js';

export class RegisterController extends BaseController {
  public readonly register = async (
    request: Request<object, RegisterSessionResponse, RegisterInput>,
    response: Response<RegisterSessionResponse>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const session = await registerLogic.register(request.body);

      this.sendResponse(response, StatusCodes.CREATED, session);
    });
  };
}

export const registerController = new RegisterController();
