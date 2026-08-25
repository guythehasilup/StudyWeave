import type { NextFunction, Response } from 'express';

export abstract class BaseController {
  protected async execute(next: NextFunction, action: () => Promise<void>): Promise<void> {
    try {
      await action();
    } catch (error: unknown) {
      next(error);
    }
  }

  protected sendResponse<T>(response: Response<T>, statusCode: number, body: T): void {
    response.status(statusCode).json(body);
  }
}
