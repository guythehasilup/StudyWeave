import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import type { SignOptions } from 'jsonwebtoken';
import { appConfig } from '../../common/config/app.config.js';
import { he } from '../../common/resources/he.resource.js';
import { AuthError } from '../errors/auth.error.js';
import type { AccessTokenPayload } from '../types/access-token-payload.type.js';

const signOptions: SignOptions = {
  algorithm: 'HS256',
  issuer: appConfig.JWT_ISSUER,
  audience: appConfig.JWT_AUDIENCE,
  expiresIn: appConfig.JWT_EXPIRES_IN as SignOptions['expiresIn'],
};

export const createAccessToken = (userId: string, username: string): string =>
  jwt.sign({ username }, appConfig.JWT_SECRET, { ...signOptions, subject: userId });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, appConfig.JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: appConfig.JWT_ISSUER,
      audience: appConfig.JWT_AUDIENCE,
    });

    if (typeof payload === 'string' || !payload.sub || !payload.username) {
      throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.authenticationRequired);
    }

    return payload as AccessTokenPayload;
  } catch {
    throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.authenticationRequired);
  }
};
