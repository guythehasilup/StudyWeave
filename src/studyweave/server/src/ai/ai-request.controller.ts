import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { BaseController } from '../common/controllers/base.controller.js';
import { aiRequestLogic } from './ai-request.logic.js';
import type { AiRequestParams } from './types/ai-request-params.type.js';
import type { AiRequestView } from './types/ai-request-view.type.js';
import type { CreateAiRequestInput } from './types/create-ai-request-input.type.js';

export class AiRequestController extends BaseController {
  public readonly create = async (
    request: Request<object, AiRequestView, CreateAiRequestInput>,
    response: Response<AiRequestView>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const userId = request.auth!.userId;

      const result = await aiRequestLogic.create(userId, request.body);

      let statusCode = StatusCodes.ACCEPTED;

      if (!result.created) {
        statusCode = StatusCodes.OK;
      }

      this.sendResponse(response, statusCode, result.request);
    });
  };

  public readonly getById = async (
    request: Request<AiRequestParams, AiRequestView>,
    response: Response<AiRequestView>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const userId = request.auth!.userId;

      const result = await aiRequestLogic.getById(userId, request.params.requestId);

      this.sendResponse(response, StatusCodes.OK, result);
    });
  };

  public readonly abort = async (
    request: Request<AiRequestParams, AiRequestView>,
    response: Response<AiRequestView>,
    next: NextFunction,
  ): Promise<void> => {
    await this.execute(next, async () => {
      const userId = request.auth!.userId;

      const result = await aiRequestLogic.abort(userId, request.params.requestId);

      this.sendResponse(response, StatusCodes.OK, result);
    });
  };
}

export const aiRequestController = new AiRequestController();
