import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../../common/errors/api-error.js';
import type { UserRecord, UserRepository } from '../users/user.repository.js';
import { createAuthService } from './auth.service.js';
import type { AuthServiceDependencies } from './auth.service.js';

const USER: UserRecord = {
  id: 'user-123',
  username: 'student',
  passwordHash: 'stored-hash',
  displayName: 'Student',
  isActive: true,
  isDeleted: false,
  lastLoginAt: null,
  createdAt: new Date('2026-09-02T12:00:00.000Z'),
  updatedAt: new Date('2026-09-02T12:00:00.000Z'),
};

/**
 * Build isolated authentication dependencies with optional repository overrides.
 *
 * @param overrides - Repository operations replaced for a test. Defaults to none.
 * @returns Deterministic fake dependencies for application-service tests.
 * @example
 * const dependencies = createDependencies({ findUserByUsername: async () => USER });
 */
const createDependencies = (overrides: Partial<UserRepository> = {}): AuthServiceDependencies => ({
  users: {
    createUser: async () => ({ ok: true, user: USER }),
    findUserByUsername: async () => USER,
    recordSuccessfulLogin: async () => true,
    ...overrides,
  },
  passwords: {
    hashPassword: async () => 'stored-hash',
    verifyPassword: async () => true,
  },
  tokens: {
    createAccessToken: () => 'access-token',
  },
});

describe('authentication service', () => {
  it('returns ISO dates and records a successful login', async () => {
    const auth = createAuthService(createDependencies());
    const session = await auth.login({
      username: 'student',
      password: 'secure-passphrase',
    });

    assert.equal(session.accessToken, 'access-token');
    assert.notEqual(session.user.lastLoginAt, null);
    assert.equal(Number.isNaN(Date.parse(session.user.lastLoginAt ?? '')), false);
    assert.equal(session.user.createdAt, '2026-09-02T12:00:00.000Z');
  });

  it('returns a stable error when credentials do not match', async () => {
    const dependencies = createDependencies({
      findUserByUsername: async () => null,
    });
    const auth = createAuthService(dependencies);

    await assert.rejects(
      auth.login({ username: 'missing', password: 'secure-passphrase' }),
      (error: unknown) => error instanceof ApiError && error.code === 'INVALID_CREDENTIALS',
    );
  });

  it('returns a stable conflict when a username already exists', async () => {
    const dependencies = createDependencies({
      createUser: async () => ({ ok: false, reason: 'USERNAME_TAKEN' }),
    });
    const auth = createAuthService(dependencies);

    await assert.rejects(
      auth.register({
        username: 'student',
        password: 'secure-passphrase',
        displayName: 'Student',
      }),
      (error: unknown) => error instanceof ApiError && error.code === 'USERNAME_TAKEN',
    );
  });
});
