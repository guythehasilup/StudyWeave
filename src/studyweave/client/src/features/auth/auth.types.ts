/**
 * Represent editable login fields owned by React Hook Form.
 *
 * @example
 * const values: LoginFormValues = { username: '', password: '' };
 */
export interface LoginFormValues {
  readonly username: string;
  readonly password: string;
}

/**
 * Represent editable registration fields owned by React Hook Form.
 *
 * @example
 * const values: RegisterFormValues = { username: '', password: '', displayName: '' };
 */
export interface RegisterFormValues {
  readonly username: string;
  readonly password: string;
  readonly displayName: string;
}

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
export interface AuthUserDto {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly isActive: boolean;
  readonly lastLoginAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Authenticated session returned by login and registration.
 *
 * @example
 * const session: AuthSessionDto = { accessToken, user };
 */
export interface AuthSessionDto {
  readonly accessToken: string;
  readonly user: AuthUserDto;
}

/**
 * Validate public user data read from an API or browser storage boundary.
 *
 * @param value - Untrusted parsed value.
 * @returns True when every public user field has the expected shape.
 * @example
 * const user = isAuthUserDto(value) ? value : null;
 */
export const isAuthUserDto = (value: unknown): value is AuthUserDto => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;

  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.username === 'string' &&
    typeof user.displayName === 'string' &&
    typeof user.isActive === 'boolean' &&
    (user.lastLoginAt === null || typeof user.lastLoginAt === 'string') &&
    typeof user.createdAt === 'string' &&
    typeof user.updatedAt === 'string'
  );
};
