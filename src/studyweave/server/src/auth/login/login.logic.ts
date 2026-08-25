import { StatusCodes } from 'http-status-codes';
import { BaseLogic } from '../../common/logic/base.logic.js';
import { he } from '../../common/resources/he.resource.js';
import { User } from '../../infra/users/models/user.model.js';
import { AuthError } from '../errors/auth.error.js';
import { verifyPassword } from '../services/password.service.js';
import { loginSessionMapper } from './mappers/login-session.mapper.js';
import type { LoginInput } from './types/login-input.type.js';
import type { LoginSessionResponse } from './types/login-session.type.js';

export class LoginLogic extends BaseLogic {
  public login(input: LoginInput): Promise<LoginSessionResponse> {
    return this.execute(async () => {
      const user = await User.findOne({
        username: input.username,
        isDeleted: false,
      })
        .select('+password')
        .exec();

      if (!user) {
        throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.invalidCredentials);
      }

      const passwordMatches = await verifyPassword(user.password, input.password);

      if (!passwordMatches || !user.isActive) {
        throw new AuthError(StatusCodes.UNAUTHORIZED, he.auth.invalidCredentials);
      }

      user.lastLoginAt = new Date();
      await user.save();

      return loginSessionMapper.toViewModel(user);
    });
  }
}

export const loginLogic = new LoginLogic();
