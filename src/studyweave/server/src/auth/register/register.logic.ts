import { StatusCodes } from 'http-status-codes';
import { mongo } from 'mongoose';
import { BaseLogic } from '../../common/logic/base.logic.js';
import { he } from '../../common/resources/he.resource.js';
import { User } from '../../infra/users/models/user.model.js';
import { AuthError } from '../errors/auth.error.js';
import { hashPassword } from '../services/password.service.js';
import { registerSessionMapper } from './mappers/register-session.mapper.js';
import type { RegisterInput } from './types/register-input.type.js';
import type { RegisterSessionResponse } from './types/register-session.type.js';

export class RegisterLogic extends BaseLogic {
  public register(input: RegisterInput): Promise<RegisterSessionResponse> {
    return this.execute(async () => {
      const passwordHash = await hashPassword(input.password);

      try {
        const user = await User.create({
          username: input.username,
          password: passwordHash,
          displayName: input.displayName,
          isDeleted: false,
        });

        return registerSessionMapper.toViewModel(user);
      } catch (error: unknown) {
        if (error instanceof mongo.MongoServerError && error.code === 11000) {
          throw new AuthError(StatusCodes.CONFLICT, he.auth.usernameTaken);
        }

        throw error;
      }
    });
  }
}

export const registerLogic = new RegisterLogic();
