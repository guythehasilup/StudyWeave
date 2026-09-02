import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../common/errors/api-error.js';
import type { UserRecord, UserRepository } from '../users/user.repository.js';
import type { AuthSessionDto, LoginInput, RegisterInput } from './auth.contracts.js';
import type { TokenService } from './token.js';

/**
 * Define the password operations injected into authentication use cases.
 *
 * @example
 * const passwords: PasswordService = { hashPassword, verifyPassword };
 */
export type PasswordService = Readonly<{
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (passwordHash: string, password: string) => Promise<boolean>;
}>;

/**
 * Collect explicit dependencies required by authentication operations.
 *
 * @example
 * const dependencies: AuthServiceDependencies = { users, passwords, tokens };
 */
export type AuthServiceDependencies = Readonly<{
  users: UserRepository;
  passwords: PasswordService;
  tokens: TokenService;
}>;

/**
 * Expose authentication application operations to the HTTP adapter.
 *
 * @example
 * const auth = createAuthService(dependencies);
 */
export type AuthService = Readonly<{
  login: (input: LoginInput) => Promise<AuthSessionDto>;
  register: (input: RegisterInput) => Promise<AuthSessionDto>;
}>;

/**
 * Map a persisted user to an ISO-date JSON DTO and issue its access token.
 *
 * @param user - Application-safe user record.
 * @param tokens - Injected token service.
 * @returns The authenticated session returned at the HTTP boundary.
 * @example
 * const session = toAuthSession(user, tokens);
 */
const toAuthSession = (user: UserRecord, tokens: TokenService): AuthSessionDto => ({
  accessToken: tokens.createAccessToken({ userId: user.id, username: user.username }),
  user: {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  },
});

/**
 * Create login and registration operations over injected ports.
 *
 * @param dependencies - Users repository, password operations, and token service.
 * @returns Authentication operations containing application orchestration only.
 * @example
 * const auth = createAuthService({ users, passwords, tokens });
 */
export const createAuthService = ({
  users,
  passwords,
  tokens,
}: AuthServiceDependencies): AuthService => {
  /**
   * Authenticate credentials and atomically record successful use.
   *
   * @param input - Validated normalized login credentials.
   * @returns A client-safe session with a newly issued access token.
   * @throws {ApiError} When credentials are invalid or the account is inactive.
   * @example
   * const session = await login({ username: 'student', password });
   */
  const login = async (input: LoginInput): Promise<AuthSessionDto> => {
    const user = await users.findUserByUsername(input.username);
    const isPasswordValid =
      user === null ? false : await passwords.verifyPassword(user.passwordHash, input.password);

    if (user === null || !isPasswordValid || !user.isActive) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'auth.errors.invalidCredentials',
      );
    }

    const loggedInAt = new Date();
    const wasRecorded = await users.recordSuccessfulLogin(user.id, loggedInAt);

    if (!wasRecorded) {
      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        'auth.errors.invalidCredentials',
      );
    }

    return toAuthSession({ ...user, lastLoginAt: loggedInAt, updatedAt: loggedInAt }, tokens);
  };

  /**
   * Register a unique user after hashing their password.
   *
   * @param input - Validated normalized registration fields.
   * @returns A client-safe session for the newly created user.
   * @throws {ApiError} When the normalized username already exists.
   * @example
   * const session = await register({ username: 'student', password, displayName: 'Student' });
   */
  const register = async (input: RegisterInput): Promise<AuthSessionDto> => {
    const passwordHash = await passwords.hashPassword(input.password);
    const result = await users.createUser({
      username: input.username,
      passwordHash,
      displayName: input.displayName,
    });

    if (!result.ok) {
      throw new ApiError(StatusCodes.CONFLICT, 'USERNAME_TAKEN', 'auth.errors.usernameTaken');
    }

    return toAuthSession(result.user, tokens);
  };

  return { login, register };
};
