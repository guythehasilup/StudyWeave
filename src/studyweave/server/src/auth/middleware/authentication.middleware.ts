import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { he } from '../../common/resources/he.resource.js';
import { User } from '../../infra/users/models/user.model.js';
import { AuthError } from '../errors/auth.error.js';
import { verifyAccessToken } from '../services/token.service.js';

export const authenticate = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorization = request.header('authorization');

    if (!authorization?.startsWith('Bearer ')) {
      throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.authenticationRequired);
    }

    const token = authorization.slice('Bearer '.length).trim();

    const payload = verifyAccessToken(token);

    const user = await User.findOne({
      id: payload.sub,
      isActive: true,
      isDeleted: false,
    })
      .select('id username')
      .lean()
      .exec();

    if (!user) {
      throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.authenticationRequired);
    }

    request.auth = { userId: user.id, username: user.username };
    next();
  } catch (error: unknown) {
    next(error);
  }
};
