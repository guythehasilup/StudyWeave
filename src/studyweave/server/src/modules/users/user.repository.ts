import { randomUUID } from 'node:crypto';
import { MongoServerError } from 'mongodb';
import type { Collection } from 'mongodb';
import type { UserDocument } from './user.document.js';

/**
 * Represent an application-safe user record returned by persistence operations.
 *
 * @example
 * const user: UserRecord = { ...persistedUser };
 */
export type UserRecord = Readonly<UserDocument>;

/**
 * Provide the values required to persist a newly registered user.
 *
 * @example
 * const input: CreateUserRecord = { username: 'student', passwordHash, displayName: 'Student' };
 */
export type CreateUserRecord = Readonly<{
  username: string;
  passwordHash: string;
  displayName: string;
}>;

/**
 * Describe the duplicate-safe result of inserting a user.
 *
 * @example
 * const result: CreateUserResult = { ok: false, reason: 'USERNAME_TAKEN' };
 */
export type CreateUserResult =
  Readonly<{ ok: true; user: UserRecord }> | Readonly<{ ok: false; reason: 'USERNAME_TAKEN' }>;

/**
 * Expose domain-specific users persistence without leaking MongoDB driver types.
 *
 * @example
 * const repository = createUserRepository(users);
 */
export type UserRepository = Readonly<{
  createUser: (input: CreateUserRecord) => Promise<CreateUserResult>;
  findUserByUsername: (username: string) => Promise<UserRecord | null>;
  recordSuccessfulLogin: (userId: string, loggedInAt: Date) => Promise<boolean>;
}>;

/**
 * Ensure indexes required by registration, login, and token authentication.
 *
 * @param users - Typed users collection owned by this service.
 * @returns A promise that resolves after indexes exist.
 * @example
 * await ensureUserIndexes(mongo.users);
 */
export const ensureUserIndexes = async (users: Collection<UserDocument>): Promise<void> => {
  await users.createIndexes([
    { key: { id: 1 }, unique: true, name: 'uq_users_id' },
    { key: { username: 1 }, unique: true, name: 'uq_users_username' },
  ]);
};

/**
 * Build focused user persistence operations over the official MongoDB driver.
 *
 * @param users - Typed users collection created during bootstrap.
 * @returns Repository operations mapped to plain application values.
 * @example
 * const repository = createUserRepository(mongo.users);
 */
export const createUserRepository = (users: Collection<UserDocument>): UserRepository => {
  /**
   * Insert a user with server-owned identifiers and lifecycle defaults.
   *
   * @param input - Validated username, password hash, and display name.
   * @returns The created user or a stable duplicate-username result.
   * @example
   * const result = await createUser({ username: 'student', passwordHash, displayName: 'Student' });
   */
  const createUser = async (input: CreateUserRecord): Promise<CreateUserResult> => {
    const now = new Date();
    const user: UserDocument = {
      id: randomUUID(),
      ...input,
      isActive: true,
      isDeleted: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await users.insertOne(user);
      return { ok: true, user };
    } catch (error: unknown) {
      if (error instanceof MongoServerError && error.code === 11_000) {
        return { ok: false, reason: 'USERNAME_TAKEN' };
      }

      throw error;
    }
  };

  /**
   * Load a non-deleted user for credential verification.
   *
   * @param username - Normalized unique username.
   * @returns The matching user, or `null` when none exists.
   * @example
   * const user = await findUserByUsername('student');
   */
  const findUserByUsername = async (username: string): Promise<UserRecord | null> =>
    users.findOne({ username, isDeleted: false });

  /**
   * Atomically record a successful login for an active user.
   *
   * @param userId - Public user identifier.
   * @param loggedInAt - Server timestamp for this successful login.
   * @returns `true` only when an eligible user was updated.
   * @example
   * const wasUpdated = await recordSuccessfulLogin(userId, new Date());
   */
  const recordSuccessfulLogin = async (userId: string, loggedInAt: Date): Promise<boolean> => {
    const result = await users.updateOne(
      { id: userId, isActive: true, isDeleted: false },
      { $set: { lastLoginAt: loggedInAt, updatedAt: loggedInAt } },
    );

    return result.modifiedCount === 1;
  };

  return {
    createUser,
    findUserByUsername,
    recordSuccessfulLogin,
  };
};
