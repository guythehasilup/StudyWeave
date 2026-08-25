import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController } from '../common/controllers/base.controller.js';
import { systemLogic } from './system.logic.js';
import type { ApiInfoResponse } from './types/api-info-response.type.js';
import type { HealthResponse } from './types/health-response.type.js';

export class SystemController extends BaseController {
  public readonly getApiInfo = async (
    _request: Request,
    response: Response<ApiInfoResponse>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const apiInfo = await systemLogic.getApiInfo();

      this.sendResponse(response, StatusCodes.OK, apiInfo);
    });
  };

  public readonly getHealth = async (
    _request: Request,
    response: Response<HealthResponse>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const health = await systemLogic.getHealth();

      this.sendResponse(response, StatusCodes.OK, health);
    });
  };
}

export const systemController = new SystemController();
