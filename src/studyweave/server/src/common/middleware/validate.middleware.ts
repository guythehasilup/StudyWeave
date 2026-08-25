import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import type { ZodType } from 'zod';
import { he } from '../resources/he.resource.js';

export const validateBody =
  (schema: ZodType): RequestHandler =>
  (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body);

    if (!result.success) {
      response.status(StatusCodes.BAD_REQUEST).json({
        message: he.validation.invalidBody,
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    request.body = result.data;
    next();
  };
