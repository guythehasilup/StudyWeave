export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
}
