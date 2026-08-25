import { BaseMapper } from '../../../common/mappers/base.mapper.js';
import type { UserDocument } from '../../../infra/users/types/user.type.js';
import { createAccessToken } from '../../services/token.service.js';
import type { RegisterSessionResponse } from '../types/register-session.type.js';

export class RegisterSessionMapper extends BaseMapper<UserDocument, RegisterSessionResponse> {
  public toViewModel(user: UserDocument): RegisterSessionResponse {
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

  public toModel(viewModel: RegisterSessionResponse): Partial<UserDocument> {
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

export const registerSessionMapper = new RegisterSessionMapper();
