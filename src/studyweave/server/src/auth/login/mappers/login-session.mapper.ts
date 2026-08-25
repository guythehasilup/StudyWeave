import { BaseMapper } from '../../../common/mappers/base.mapper.js';
import type { UserDocument } from '../../../infra/users/types/user.type.js';
import { createAccessToken } from '../../services/token.service.js';
import type { LoginSessionResponse } from '../types/login-session.type.js';

export class LoginSessionMapper extends BaseMapper<UserDocument, LoginSessionResponse> {
  public toViewModel(user: UserDocument): LoginSessionResponse {
    const accessToken = createAccessToken(user.id, user.username);

    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  public toModel(viewModel: LoginSessionResponse): Partial<UserDocument> {
    const { user } = viewModel;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isDeleted: false,
    };
  }
}

export const loginSessionMapper = new LoginSessionMapper();
