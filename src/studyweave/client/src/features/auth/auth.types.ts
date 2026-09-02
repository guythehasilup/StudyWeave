/**
 * Represent editable login fields owned by React Hook Form.
 *
 * @example
 * const values: LoginFormValues = { username: '', password: '' };
 */
export type LoginFormValues = Readonly<{
  username: string;
  password: string;
}>;

/**
 * Represent editable registration fields owned by React Hook Form.
 *
 * @example
 * const values: RegisterFormValues = { username: '', password: '', displayName: '' };
 */
export type RegisterFormValues = Readonly<{
  username: string;
  password: string;
  displayName: string;
}>;

/**
 * Validated login request sent to the authentication API.
 *
 * @example
 * const input: LoginInput = { username: 'student', password: 'secure-passphrase' };
 */
export type LoginInput = Readonly<LoginFormValues>;

/**
 * Validated registration request sent to the authentication API.
 *
 * @example
 * const input: RegisterInput = { username: 'student', password: 'secure-passphrase', displayName: 'Student' };
 */
export type RegisterInput = Readonly<RegisterFormValues>;

/**
 * Describe the authenticated user returned by the public API.
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
 * Authenticated session returned by login and registration.
 *
 * @example
 * const session: AuthSessionDto = { accessToken, user };
 */
export type AuthSessionDto = Readonly<{
  accessToken: string;
  user: AuthUserDto;
}>;
