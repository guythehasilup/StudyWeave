import type { BaseModel } from '../../../common/models/base.model.js';

export interface UserDocument extends BaseModel {
  username: string;
  password: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: Date | null;
}
