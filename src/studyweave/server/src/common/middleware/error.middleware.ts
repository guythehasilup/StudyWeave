import type { ErrorRequestHandler, RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import { appConfig } from '../config/app.config.js';
import { BaseError } from '../errors/base.error.js';
import { he } from '../resources/he.resource.js';

export const notFoundHandler: RequestHandler = (_request, response) => {
  response.status(StatusCodes.NOT_FOUND).json({ message: he.errors.notFound });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof BaseError) {
    response.status(error.statusCode).json({ message: error.message });
    return;
  }

  if (appConfig.NODE_ENV !== 'test') {
    let errorName = 'UnknownError';

    if (error instanceof Error) {
      errorName = error.name;
    }

    console.error('# Unexpected server error.', { errorName });
  }

  response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: he.errors.internal,
  });
};
