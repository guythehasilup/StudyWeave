/**
 * Describe validated credentials accepted by the login endpoint.
 *
 * @example
 * const input: LoginInput = { username: 'student', password: 'secure-passphrase' };
 */
export type LoginInput = Readonly<{
  username: string;
  password: string;
}>;

/**
 * Describe validated account values accepted by the registration endpoint.
 *
 * @example
 * const input: RegisterInput = { username: 'student', password: 'secure-passphrase', displayName: 'Student' };
 */
export type RegisterInput = Readonly<{
  username: string;
  password: string;
  displayName: string;
}>;

/**
 * Describe the client-safe authenticated user at the JSON boundary.
 *
 * @example
 * const user: AuthUserDto = { id, username, displayName, isActive: true, lastLoginAt: null, createdAt, updatedAt };
 */
export type AuthUserDto = Readonly<{
  id: string;
  username: string;
  displayName: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}>;

/**
 * Return an access token with its client-safe user representation.
 *
 * @example
 * const session: AuthSessionDto = { accessToken, user };
 */
export type AuthSessionDto = Readonly<{
  accessToken: string;
  user: AuthUserDto;
}>;
