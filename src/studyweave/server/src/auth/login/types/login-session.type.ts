import type { BaseViewModel } from '../../../common/types/base-view-model.type.js';

export interface LoginUserResponse extends BaseViewModel {
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}

export interface LoginSessionResponse {
  accessToken: string;
  user: LoginUserResponse;
}
