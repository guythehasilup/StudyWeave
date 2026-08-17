import type { BaseViewModel } from '../../../common/types/base-view-model.type.js';

export interface RegisterUserResponse extends BaseViewModel {
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface RegisterSessionResponse {
  accessToken: string;
  user: RegisterUserResponse;
}
